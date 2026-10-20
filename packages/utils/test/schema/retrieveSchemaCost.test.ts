import { RJSF_REF_CYCLE_KEY, getDefaultFormState, isObject, retrieveSchema } from '../../src/index.ts';
import type { RJSFSchema } from '../../src/index.ts';
import { miniValidator } from './graph/miniValidator.ts';

function wideSchema(): RJSFSchema {
  const properties: Record<string, RJSFSchema> = { child: { $ref: '#/definitions/child' } };
  for (let index = 0; index < 200; index += 1) {
    properties[`f${index}`] = { type: 'string' };
  }
  return {
    definitions: {
      child: {
        type: 'object',
        properties: { a: { type: 'string' } },
        if: { properties: { a: { const: 'x' } } },
        then: { properties: { b: { type: 'string' } } },
      },
    },
    type: 'object',
    properties,
  };
}

// Each edit hands the form a new data object, so the cost of an edit is what a call for new data costs. These count
// what is rebuilt rather than time it, so they hold on any machine.
describe('the cost of an edit to a wide object', () => {
  it('hands out the same view of a field until a key the view reads changes', () => {
    const context = { validator: miniValidator() };
    const root = wideSchema();
    const view = retrieveSchema(context, root, root, { f0: 'a' });
    expect(retrieveSchema(context, root, root, { f0: 'b', f1: 'c' })).toBe(view);
    expect(retrieveSchema(context, view, root, { f0: 'd' })).toBe(view);
    // `child` is handed out as it stands whatever its data, so an object there keeps the view too
    expect(retrieveSchema(context, root, root, { f0: 'e', child: { a: 'x' } })).toBe(view);
    expect(retrieveSchema(context, root, root, { f0: 'e' }, true)).not.toBe(view);
  });
  it('hands out the same view of a field offering no options when asked to resolve its options, as ObjectField asks', () => {
    const context = { validator: miniValidator() };
    const root = wideSchema();
    const view = retrieveSchema(context, root, root, { f0: 'a' }, true);
    expect(retrieveSchema(context, root, root, { f0: 'b', f1: 'c' }, true)).toBe(view);
  });
  it('hands out a new view once a key the view reads would collapse, even when its object is mutated in place', () => {
    const context = { validator: miniValidator() };
    const root: RJSFSchema = {
      definitions: {
        node: {
          type: 'object',
          properties: {
            k: { type: 'string' },
            child: {
              type: 'object',
              properties: { a: { type: 'string' } },
              if: { properties: { a: { const: 'x' } }, required: ['a'] },
              then: { $ref: '#/definitions/node' },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    };
    const child = { a: 'y' };
    const view = retrieveSchema(context, root, root, { child });
    expect(retrieveSchema(context, root, root, { k: 'e', child })).toBe(view);
    child.a = 'x';
    const collapsed = retrieveSchema(context, root, root, { k: 'e', child });
    expect(collapsed).not.toBe(view);
    const shownChild = collapsed.properties?.child;
    expect(isObject(shownChild) && Reflect.get(shownChild, RJSF_REF_CYCLE_KEY)).toBe(true);
  });
  it('plans a spread copy of a handed-out view once while its keywords stay the same', () => {
    const context = { validator: miniValidator() };
    const root = wideSchema();
    const view = retrieveSchema(context, root, root, {});
    const copy = retrieveSchema(context, { ...view, title: 'T' }, root, { f0: 'a' });
    expect(copy.title).toBe('T');
    expect(retrieveSchema(context, { ...view, title: 'T' }, root, { f0: 'b' })).toBe(copy);
    expect(retrieveSchema(context, { ...view, title: 'U' }, root, { f0: 'b' }).title).toBe('U');
  });
  it('checks no condition again for the defaults of an edit to a property that merges nothing', () => {
    const validator = miniValidator();
    const root = wideSchema();
    getDefaultFormState({ validator }, { schema: root, rootSchema: root, formData: { f0: 'a' } });
    const first = validator.calls;
    getDefaultFormState({ validator }, { schema: root, rootSchema: root, formData: { f0: 'b' } });
    expect(validator.calls).toBe(first);
  });
});
