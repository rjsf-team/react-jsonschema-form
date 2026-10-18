import type { RJSFSchema } from '@rjsf/utils';

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
  test('length checks work in the compiled output (one character, emoji)', () => {
    // Length keywords count code points through a helper the standalone bundle must include.
    const lengthSchema: RJSFSchema = {
      $id: 'lengths',
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 80 },
        code: { type: 'string', maxLength: 2 },
      },
      required: ['name'],
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(lengthSchema)), lengthSchema);

    expect(validator.isValid(lengthSchema, { name: 'a' }, lengthSchema)).toBe(true);
    expect(validator.isValid(lengthSchema, { name: '😀' }, lengthSchema)).toBe(true);
    expect(validator.isValid(lengthSchema, { name: '' }, lengthSchema)).toBe(false);
    expect(validator.isValid(lengthSchema, { name: 'a', code: '😀😀' }, lengthSchema)).toBe(true);
    expect(validator.isValid(lengthSchema, { name: 'a', code: '😀😀😀' }, lengthSchema)).toBe(false);
  });

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

  test('passes ataOptionsOverrides through to the compiled output', () => {
    const emailSchema: RJSFSchema = {
      $id: 'email',
      type: 'object',
      properties: { email: { type: 'string', format: 'email' } },
    };
    const strict = loadModule(compileSchemaValidatorsCode(emailSchema));
    const loose = loadModule(
      compileSchemaValidatorsCode(emailSchema, { ataOptionsOverrides: { assertFormat: false } }),
    );
    expect(strict.email({ email: 'nope' })).toBe(false);
    expect(loose.email({ email: 'nope' })).toBe(true);
  });

  test('warns about options the generated module cannot carry, and still compiles', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const code = compileSchemaValidatorsCode(schema, {
        ataOptionsOverrides: { coerceTypes: true, removeAdditional: true },
        additionalMetaSchemas: [{ $id: 'extra' }],
        extenderFn: (v) => v,
      });
      expect(typeof loadModule(code).root).toBe('function');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(
        /extenderFn, additionalMetaSchemas, ataOptionsOverrides\.coerceTypes, ataOptionsOverrides\.removeAdditional cannot be carried/,
      );

      // Options that only restate defaults, or do not change answers, compile without a warning.
      warn.mockClear();
      compileSchemaValidatorsCode(schema, {
        ataOptionsOverrides: {
          verbose: true,
          useDefaults: true,
          abortEarly: false,
          coerceTypes: undefined,
          logger: false,
        },
        additionalMetaSchemas: [],
      });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
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
});
