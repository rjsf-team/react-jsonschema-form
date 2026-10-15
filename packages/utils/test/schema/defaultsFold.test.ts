import { getDefaultFormState } from '../../src/index.ts';
import type { DefaultFormStateBehavior, RJSFSchema } from '../../src/index.ts';
import { getObjectDefaults } from '../../src/schema/getDefaultFormState.ts';
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

  it("applies the ui:definitions entry of a $ref an allOf merges in beneath the field's own", () => {
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
    ).toEqual({ field: { b: 'from A', c: 'from B' } });
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
});
