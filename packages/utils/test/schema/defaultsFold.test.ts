import { getDefaultFormState } from '../../src/index.ts';
import type { DefaultFormStateBehavior, RJSFSchema } from '../../src/index.ts';
import { computeDefaults, getObjectDefaults } from '../../src/schema/getDefaultFormState.ts';
import { miniValidator } from './graph/miniValidator.ts';

const validator = miniValidator();

describe('getDefaultFormState() as one fold over the merge plan', () => {
  it('merges the then of an if inside an allOf it populates, under skipEmptyDefaults', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        pet: {
          type: 'object',
          properties: { kind: { type: 'string', default: 'cat' } },
          allOf: [
            {
              if: { properties: { kind: { const: 'cat' } } },
              then: { properties: { meow: { type: 'string', default: 'yes' } } },
            },
          ],
        },
      },
    };
    const defaultFormStateBehavior: DefaultFormStateBehavior = {
      emptyObjectFields: 'skipEmptyDefaults',
      allOf: 'populateDefaults',
    };
    expect(
      getDefaultFormState({ validator, defaultFormStateBehavior }, { schema, formData: { pet: { kind: 'cat' } } }),
    ).toEqual({ pet: { kind: 'cat', meow: 'yes' } });
  });

  it("applies the ui:definitions entry of the field's own $ref only, not that of a $ref an allOf merges in", () => {
    const schema: RJSFSchema = {
      definitions: {
        A: { allOf: [{ $ref: '#/definitions/B' }], properties: { a: { type: 'string' } } },
        B: { type: 'object', properties: { b: { type: 'string' }, c: { type: 'string' } } },
      },
      type: 'object',
      properties: { field: { $ref: '#/definitions/A' } },
    };
    const uiSchema = {
      'ui:definitions': {
        '#/definitions/A': { b: { 'ui:initialValue': 'from A' } },
        '#/definitions/B': { b: { 'ui:initialValue': 'from B' }, c: { 'ui:initialValue': 'from B' } },
      },
    };
    expect(
      getDefaultFormState(
        { validator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
        { schema, rootSchema: schema, uiSchema },
      ),
    ).toEqual({ field: { b: 'from A' } });
  });

  describe('options a customMergeAllOf rewrote', () => {
    // The merge hands back a copy of the options, which no node of the schema declares
    const customMergeAllOf = (schema: RJSFSchema): RJSFSchema => {
      const [member] = schema.allOf ?? [];
      return typeof member === 'object' ? { ...member, anyOf: member.anyOf?.map((option) => option) } : {};
    };

    it("computes an object's defaults from the option merged into it, as written", () => {
      const schema: RJSFSchema = {
        allOf: [
          {
            type: 'object',
            properties: { a: { type: 'string', default: 'a' } },
            anyOf: [{ properties: { b: { type: 'string', default: 'b' } } }],
          },
        ],
      };
      expect(getDefaultFormState({ validator, customMergeAllOf }, { schema })).toEqual({ a: 'a', b: 'b' });
    });

    it('computes the defaults of any other field from the option as it is rendered', () => {
      const schema: RJSFSchema = {
        definitions: { S: { type: 'string', default: 's' } },
        allOf: [{ type: 'string', anyOf: [{ $ref: '#/definitions/S' }] }],
      };
      expect(getDefaultFormState({ validator, customMergeAllOf }, { schema })).toEqual('s');
    });
  });

  it('reads a tuple item a customMergeAllOf adds as it stands', () => {
    const schema: RJSFSchema = { allOf: [{ type: 'array' }] };
    const customMergeAllOf = (): RJSFSchema => ({ type: 'array', items: [{ type: 'string', default: 'a' }] });
    expect(getDefaultFormState({ validator, customMergeAllOf }, { schema })).toEqual(['a']);
  });

  it('getObjectDefaults() resolves a schema holding an if before reading its properties', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', default: 'a' } },
      if: { properties: { a: { const: 'a' } } },
      then: { properties: { b: { type: 'string', default: 'b' } } },
    };
    expect(getObjectDefaults({ validator }, schema, { rootSchema: schema, rawFormData: { a: 'a' } })).toEqual({
      a: 'a',
      b: 'b',
    });
  });

  describe('a default beside a $ref whose target declares one', () => {
    const definitions: RJSFSchema['definitions'] = {
      s: { type: 'string', default: 'target' },
      o: { type: 'object', properties: { s: { type: 'string' } }, default: { s: 'target' } },
      alias: { $ref: '#/definitions/s', default: 'alias' },
    };
    const defaultsOf = (schema: RJSFSchema, formData?: unknown) =>
      getDefaultFormState({ validator }, { schema: { definitions, ...schema }, formData });

    it('overrides the target, as every other keyword beside the $ref does', () => {
      expect(
        defaultsOf({
          type: 'object',
          properties: {
            p: { $ref: '#/definitions/s', default: 'beside' },
            o: { $ref: '#/definitions/o', default: { s: 'beside' } },
            nested: { type: 'object', properties: { p: { $ref: '#/definitions/s', default: 'beside' } } },
          },
        }),
      ).toEqual({ p: 'beside', o: { s: 'beside' }, nested: { p: 'beside' } });
      expect(defaultsOf({ $ref: '#/definitions/s', default: 'beside' })).toBe('beside');
      expect(defaultsOf({ type: 'array', minItems: 1, items: { $ref: '#/definitions/s', default: 'beside' } })).toEqual(
        ['beside'],
      );
    });
    it('overrides it along an alias chain, past a $ref back into a recursion and in computeDefaults()', () => {
      expect(
        defaultsOf({
          type: 'object',
          properties: {
            outer: { $ref: '#/definitions/alias', default: 'beside' },
            inner: { $ref: '#/definitions/alias' },
          },
        }),
      ).toEqual({ outer: 'beside', inner: 'alias' });
      expect(
        computeDefaults({ validator }, { $ref: '#/definitions/s', default: 'beside' }, { rootSchema: { definitions } }),
      ).toBe('beside');
      const node: RJSFSchema = {
        type: 'object',
        properties: { v: { $ref: '#/definitions/s', default: 'beside' }, child: { $ref: '#/definitions/node' } },
      };
      expect(defaultsOf({ definitions: { ...definitions, node }, $ref: '#/definitions/node' })).toEqual({
        v: 'beside',
        child: { v: 'beside' },
      });
      const tree: RJSFSchema = {
        type: 'object',
        default: { name: 'target' },
        properties: {
          name: { type: 'string' },
          child: { $ref: '#/definitions/tree', default: { name: 'beside' } },
        },
      };
      expect(defaultsOf({ definitions: { ...definitions, tree }, $ref: '#/definitions/tree' })).toEqual({
        name: 'target',
        child: { name: 'beside', child: { name: 'beside' } },
      });
    });
  });

  describe('a recursion through an option list a property reaches through its $ref', () => {
    const nested = (depth: number): object => (depth === 0 ? {} : { c: nested(depth - 1) });
    const withOptions = (options: RJSFSchema): RJSFSchema => ({
      definitions: {
        options,
        node: {
          type: 'object',
          properties: { name: { type: 'string', default: 'n' }, c: { $ref: '#/definitions/options' } },
        },
      },
      $ref: '#/definitions/node',
    });

    it('stops where the option list written on the property stops, whatever the data holds below', () => {
      const schema = withOptions({
        type: 'object',
        oneOf: [{ $ref: '#/definitions/node' }, { properties: { z: { type: 'string', default: 'z' } } }],
      });
      expect(getDefaultFormState({ validator }, { schema })).toEqual({ name: 'n', c: { name: 'n' } });
      expect(getDefaultFormState({ validator }, { schema, rootSchema: schema, formData: nested(7) })).toEqual({
        name: 'n',
        c: { name: 'n', c: nested(5) },
      });
    });
    it('for an option list that is not an object as well', () => {
      const schema = withOptions({ anyOf: [{ $ref: '#/definitions/node' }, { type: 'null' }] });
      expect(getDefaultFormState({ validator }, { schema, rootSchema: schema, formData: nested(4) })).toEqual({
        name: 'n',
        c: { name: 'n', c: nested(2) },
      });
    });
  });
});
