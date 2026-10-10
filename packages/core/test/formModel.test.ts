import type { RJSFSchema } from '@rjsf/utils';
import { ROOT_FIELD_PATH, toErrorList, toFieldPath } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import type { FormProps } from '../src/components/Form.tsx';
import { createFormModel } from '../src/components/formModel.ts';
import { initialState } from '../src/components/formState.ts';

const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };

function createModel() {
  const props: FormProps = { schema, validator };
  return { model: createFormModel(props, initialState(props)), props };
}

describe('proposing()', () => {
  it('has the form render only for a view that did not reach the model', () => {
    const { model } = createModel();
    const listener = vi.fn();
    model.subscribe(listener);

    // The edit reached the model, which notified for it
    const reached = model.proposing();
    model.handle.setFieldValue('a', 'x');
    reached();
    expect(listener).toHaveBeenCalledTimes(1);

    // A view the model never heard of, as one a custom parent kept to itself is, has nothing else to render the form
    // for it
    model.proposing()();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('has the form render for a view sent while React commits a render the store asked for', () => {
    const { model, props } = createModel();
    const listener = vi.fn();
    model.subscribe(listener);
    model.handle.setFieldValue('a', 'x');
    const rendered = model.getSnapshot();
    const epoch = model.epoch();

    // A field React cleans up in that commit sends a view to a custom parent, which keeps the change to itself. The
    // commit has yet to reach the model, and it is the only render on its way
    model.proposing()();
    model.committed(props, rendered.state, rendered);

    expect(listener).toHaveBeenCalledTimes(2);
    // The field's record of the view outlives the commit, until the render it asked for
    expect(model.epoch()).toBe(epoch);
  });
});

describe('the errors a field raises', () => {
  it('leave no node behind for the items a raised array holds nothing for, once the rest are dropped', () => {
    const { model, unmount } = createMountedModel({
      schema: { type: 'object', properties: { list: { type: 'array', items: { type: 'string' } } } },
    });

    model.handleChange({ list: ['a', 'b'] }, ROOT_FIELD_PATH, { list: [undefined, { __errors: ['taken'] }] });
    model.handleChange('c', toFieldPath(1, toFieldPath('list')));

    expect(model.getSnapshot().state.customErrors).toBeUndefined();
    unmount();
  });

  it('keep the errors of a property named __proto__ in a raised array as that property', () => {
    const { model, unmount } = createMountedModel({
      schema: { type: 'object', properties: { list: { type: 'array', items: { type: 'object' } } } },
    });

    model.handleChange({ list: [{}] }, ROOT_FIELD_PATH, {
      list: [JSON.parse('{"__proto__": {"__errors": ["taken"]}}')],
    });

    const { customErrors } = model.getSnapshot().state;
    expect(Object.getPrototypeOf(customErrors?.list?.[0])).toBe(Object.prototype);
    expect(toErrorList(customErrors)).toEqual([
      { property: '.list.0.__proto__', message: 'taken', stack: '.list.0.__proto__ taken' },
    ]);
    unmount();
  });

  it('keep the errors of a property named __proto__ as that property when a sibling is renamed', () => {
    const { model, unmount } = createMountedModel({
      schema: { type: 'object', properties: { obj: { type: 'object', additionalProperties: { type: 'string' } } } },
    });
    const objPath = toFieldPath('obj');

    model.handleChange({ obj: { a: 'x' } }, ROOT_FIELD_PATH, {
      obj: JSON.parse('{"__proto__": {"__errors": ["proto"]}, "a": {"__errors": ["renamed"]}}'),
    });
    model.sendMove({ fieldPath: objPath, newKeyOf: (key) => (key === 'a' ? 'c' : key) }, () =>
      model.handleChange({ c: 'x' }, objPath),
    );

    const { customErrors } = model.getSnapshot().state;
    expect(Object.getPrototypeOf(customErrors?.obj)).toBe(Object.prototype);
    expect(toErrorList(customErrors)).toEqual([
      { property: '.obj.__proto__', message: 'proto', stack: '.obj.__proto__ proto' },
      { property: '.obj.c', message: 'renamed', stack: '.obj.c renamed' },
    ]);
    unmount();
  });
});
