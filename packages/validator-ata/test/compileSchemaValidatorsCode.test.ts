import type { RJSFSchema } from '@rjsf/utils';
import { getDefaultFormState, mergeSchemas, retrieveSchema } from '@rjsf/utils';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import { createPrecompiledValidator } from '../src/index.ts';

// Evaluate generated CJS module source into an exports object.
function loadModule(code: string) {
  const module = { exports: {} as Record<string, any> };
  // oxlint-disable-next-line no-new-func, no-implied-eval
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

const schema: RJSFSchema = {
  $id: 'root',
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: { $ref: '#/definitions/address' },
  },
  required: ['name'],
  definitions: {
    address: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
  },
};

describe('compileSchemaValidatorsCode', () => {
  test('generates a module with a validator function per schema id', () => {
    const code = compileSchemaValidatorsCode(schema);
    const validateFns = loadModule(code);
    const validator = createPrecompiledValidator(validateFns, schema);

    expect(validator.isValid(schema, { name: 'Mert' }, schema)).toBe(true);
    expect(validator.isValid(schema, { name: 5 }, schema)).toBe(false);
  });

  test('resolves cross-schema $ref in the compiled output', () => {
    const code = compileSchemaValidatorsCode(schema);
    const validateFns = loadModule(code);
    const validator = createPrecompiledValidator(validateFns, schema);

    const good = validator.validateFormData({ name: 'Mert', address: { city: 'Istanbul' } }, schema);
    expect(good.errors).toHaveLength(0);
    const bad = validator.validateFormData({ name: 'Mert', address: {} }, schema);
    expect(bad.errors.length).toBeGreaterThan(0);
  });

  test('reports a clear error for a schema ata cannot compile to standalone', () => {
    // ata returns null for a $defs entry that carries its own $id, so a validator
    // in the bundle can be absent. The wrapper must surface that rather than crash
    // with "x is not a function".
    const idDefSchema: RJSFSchema = {
      $id: 'rootWithIdDef',
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: { $ref: '#/definitions/address' },
      },
      required: ['name'],
      definitions: {
        address: { $id: 'addressDef', type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
      },
    };
    const validateFns = loadModule(compileSchemaValidatorsCode(idDefSchema));
    Object.keys(validateFns).forEach((key) => {
      try {
        validateFns[key]({});
      } catch (err) {
        expect((err as Error).message).toContain('was not compiled to a standalone validator');
        expect((err as Error).message).not.toMatch(/is not a function/);
      }
    });
  });

  test('embeds RegExp and string custom formats into the compiled output', () => {
    const fmtSchema: RJSFSchema = {
      $id: 'fmt',
      type: 'object',
      properties: {
        code: { type: 'string', format: 'upperHex' },
        tag: { type: 'string', format: 'lowerTag' },
      },
      required: ['code', 'tag'],
    };
    const code = compileSchemaValidatorsCode(fmtSchema, {
      customFormats: { upperHex: /^[0-9A-F]+$/, lowerTag: '^[a-z]+$' },
    });
    const validator = createPrecompiledValidator(loadModule(code), fmtSchema);

    expect(validator.isValid(fmtSchema, { code: 'AB12', tag: 'blue' }, fmtSchema)).toBe(true);
    expect(validator.isValid(fmtSchema, { code: 'xy', tag: 'blue' }, fmtSchema)).toBe(false);
    expect(validator.isValid(fmtSchema, { code: 'AB12', tag: 'Blue' }, fmtSchema)).toBe(false);
  });

  test('rejects a function custom format, which cannot be serialized into a bundle', () => {
    const fmtSchema: RJSFSchema = {
      $id: 'fmtFn',
      type: 'object',
      properties: { even: { type: 'string', format: 'evenLength' } },
    };
    expect(() =>
      compileSchemaValidatorsCode(fmtSchema, {
        customFormats: { evenLength: (value: string) => value.length % 2 === 0 },
      }),
    ).toThrow(/custom format "evenLength" is a function/);
  });

  test('reports per-field errors for schema-valued additionalProperties', () => {
    // ata-validator >= 0.17.4 emits a per-property error for schema-valued
    // additionalProperties in the compiled output, matching the runtime validator,
    // so form fields for additional properties get their own error.
    const apSchema: RJSFSchema = {
      $id: 'apRoot',
      type: 'object',
      properties: { a: { type: 'string' } },
      additionalProperties: { type: 'number' },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(apSchema)), apSchema);
    const { errors } = validator.validateFormData({ a: 'x', bad: 'notnum', also: 'nope' }, apSchema);
    expect(errors.map((e) => e.property).sort()).toEqual(['.also', '.bad']);
  });

  describe('with a customMergeAllOf', () => {
    // `p` is both a named property and a patternProperties match, so the parser merges `{ allOf: [p, pattern] }`
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: { p: { type: 'object', properties: { x: { type: 'string' } } } },
      patternProperties: {
        '^p$': { properties: { choice: { oneOf: [{ const: 'a' }, { const: 'b' }] } } },
      },
    };
    // Produces `oneOf` options that differ from the default merge's, so their hashes differ too
    const customMergeAllOf = (schema: RJSFSchema): RJSFSchema => {
      const { allOf, ...rest } = schema;
      const merged = (allOf as RJSFSchema[]).reduce((acc, s) => mergeSchemas(acc, s) as RJSFSchema, rest);
      const choice = merged.properties?.choice as RJSFSchema | undefined;
      if (!choice?.oneOf) {
        return merged;
      }
      const oneOf = choice.oneOf.map((o) => ({ ...(o as RJSFSchema), title: `Option ${(o as RJSFSchema).const}` }));
      return { ...merged, properties: { ...merged.properties, choice: { ...choice, oneOf } } };
    };
    const formData = { p: { choice: 'b' } };

    test('misses the custom-merged sub-schemas when compiled without it', () => {
      const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
      expect(() =>
        getDefaultFormState({ validator, customMergeAllOf }, { schema: rootSchema, rootSchema, formData }),
      ).toThrow('No precompiled validator function was found for the given schema');
    });
    test('covers the custom-merged sub-schemas when compiled with it', () => {
      const validator = createPrecompiledValidator(
        loadModule(compileSchemaValidatorsCode(rootSchema, {}, { customMergeAllOf })),
        rootSchema,
      );
      expect(
        getDefaultFormState({ validator, customMergeAllOf }, { schema: rootSchema, rootSchema, formData }),
      ).toEqual(formData);
    });
    test.each([
      ['on submit, against the root schema', false],
      ['under live validation, against the root schema the form resolved', true],
    ])('validates %s with a customValidate when compiled with it', (_when, resolveRoot) => {
      const validator = createPrecompiledValidator(
        loadModule(compileSchemaValidatorsCode(rootSchema, {}, { customMergeAllOf })),
        rootSchema,
        { customMergeAllOf },
      );
      const context = { validator, customMergeAllOf };
      const invalidFormData = { p: { choice: 'b', x: 5 } };
      const schema = resolveRoot ? retrieveSchema(context, rootSchema, rootSchema, invalidFormData) : rootSchema;
      // A `customValidate` makes the validator compute the form's defaults, which validate the custom-merged `oneOf`
      const customValidate = vi.fn((_formData, errors) => errors);

      const { errors } = validator.validateFormData(invalidFormData, schema, customValidate);

      expect(errors.map((e) => e.property)).toEqual(['.p.x']);
      expect(customValidate).toHaveBeenCalledWith(invalidFormData, expect.anything(), undefined, expect.anything());
    });
  });
});
