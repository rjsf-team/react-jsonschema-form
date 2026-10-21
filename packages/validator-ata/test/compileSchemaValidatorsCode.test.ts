import type { RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils } from '@rjsf/utils';
import type { Validator } from 'ata-validator';

import nestedResourceTests from '../../utils/test/testUtils/nestedResourceTests.ts';
import precompiledCoverageTests from '../../utils/test/testUtils/precompiledCoverageTests.ts';
import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import { createPrecompiledValidator } from '../src/index.ts';
import loadModule from './harness/loadModule.ts';

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

  test('compiles the options that keep a $ref to the root for scoring, defaults and omitting', () => {
    const rootSchema: RJSFSchema = {
      definitions: {
        Name: { type: 'string' },
        Cat: { type: 'object', properties: { name: { $ref: '#/definitions/Name' }, meow: { type: 'boolean' } } },
        Dog: { type: 'object', properties: { name: { $ref: '#/definitions/Name' }, bark: { type: 'number' } } },
      },
      type: 'object',
      properties: { pet: { oneOf: [{ $ref: '#/definitions/Cat' }, { $ref: '#/definitions/Dog' }] } },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    const schemaUtils = createSchemaUtils({ validator }, rootSchema);
    const formData = { pet: { name: 'Rex', bark: 2 } };
    expect(schemaUtils.getDefaultFormState(rootSchema, formData)).toEqual(formData);
    expect(schemaUtils.omitExtraData(rootSchema, { pet: { name: 'Rex', bark: 2, extra: true } })).toEqual(formData);
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

  test('warns once about options the generated module cannot carry, and still compiles', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const options = {
        ataOptionsOverrides: { coerceTypes: true, removeAdditional: true },
        additionalMetaSchemas: [{ type: 'string' }, { $id: '', type: 'string' }],
        extenderFn: (validator: Validator) => validator,
      };
      const code = compileSchemaValidatorsCode(schema, options);
      expect(typeof loadModule(code).root).toBe('function');
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn.mock.calls[0][0]).toMatch(
        /entries without an \$id are ignored; ata requires an \$id, so customizeValidator\(\) throws for them/,
      );
      expect(warn.mock.calls[1][0]).toMatch(
        /extenderFn, ataOptionsOverrides\.coerceTypes, ataOptionsOverrides\.removeAdditional cannot be carried into a precompiled validator and are ignored; the precompiled and runtime validators may disagree/,
      );

      // Compiling again with the same options, as a server compiling per request does, stays quiet.
      warn.mockClear();
      compileSchemaValidatorsCode(schema, options);
      expect(warn).not.toHaveBeenCalled();

      compileSchemaValidatorsCode(schema, { ataOptionsOverrides: { keywords: { even: () => true } } });
      expect(warn.mock.calls[0][0]).toMatch(/ataOptionsOverrides\.keywords cannot be carried .* and is ignored/);

      warn.mockClear();
      compileSchemaValidatorsCode(schema, { suppressDuplicateFiltering: 'all' });
      expect(warn.mock.calls[0][0]).toMatch(
        /suppressDuplicateFiltering .* pass it to createPrecompiledValidator\(\) instead/,
      );

      // Options that only restate defaults compile without a warning.
      warn.mockClear();
      compileSchemaValidatorsCode(schema, {
        ataOptionsOverrides: {
          verbose: true,
          abortEarly: false,
          coerceTypes: undefined,
          logger: false,
          keywords: {},
          schemas: {},
        },
        additionalMetaSchemas: [],
      });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test('compiles extra schemas with an $id into the module, so a custom meta-schema applies', () => {
    // A meta-schema with no validation vocabulary turns off `minimum` and `type`, so the
    // runtime validator accepts { n: 1 }. The module must agree, which needs the meta-schema.
    const meta = {
      $id: 'https://example.com/meta',
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $vocabulary: {
        'https://json-schema.org/draft/2020-12/vocab/core': true,
        'https://json-schema.org/draft/2020-12/vocab/applicator': true,
      },
    };
    const metaSchema: RJSFSchema = {
      $id: 'loose',
      $schema: 'https://example.com/meta',
      type: 'object',
      properties: { n: { type: 'number', minimum: 5 } },
    };
    const { $id: _id, ...unnamed } = meta;
    const fromMeta = loadModule(compileSchemaValidatorsCode(metaSchema, { additionalMetaSchemas: [meta] }));
    const fromRecord = loadModule(
      compileSchemaValidatorsCode(metaSchema, {
        ataOptionsOverrides: { schemas: { 'https://example.com/meta': unnamed } },
      }),
    );
    const fromList = loadModule(compileSchemaValidatorsCode(metaSchema, { ataOptionsOverrides: { schemas: [meta] } }));
    const without = loadModule(compileSchemaValidatorsCode(metaSchema));
    for (const fns of [fromMeta, fromRecord, fromList]) {
      expect(Object.keys(fns)).toEqual(['loose']);
      expect(fns.loose({ n: 1 })).toBe(true);
    }
    expect(without.loose({ n: 1 })).toBe(false);
  });

  test('compiles a record entry under its key and its own $id, as the runtime validator registers both', () => {
    // Without the validation vocabulary, `minimum` is not checked, so { n: 1 } is valid.
    const meta = {
      $id: 'https://example.com/declared',
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $vocabulary: { 'https://json-schema.org/draft/2020-12/vocab/applicator': true },
    };
    const loose = (dialect: string): RJSFSchema => ({
      $id: 'loose',
      $schema: dialect,
      type: 'object',
      properties: { n: { type: 'number', minimum: 5 } },
    });
    const options = { ataOptionsOverrides: { schemas: { 'https://example.com/key': meta } } };
    for (const dialect of ['https://example.com/key', 'https://example.com/declared']) {
      expect(loadModule(compileSchemaValidatorsCode(loose(dialect), options)).loose({ n: 1 })).toBe(true);
    }
  });

  test('leaves official meta-schemas out of the module, since ata already knows them', () => {
    const draft07 = {
      $id: 'http://json-schema.org/draft-07/schema#',
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: ['object', 'boolean'],
    };
    expect(compileSchemaValidatorsCode(schema, { additionalMetaSchemas: [draft07] })).toBe(
      compileSchemaValidatorsCode(schema),
    );
  });

  test('does not fill in defaults, unlike the runtime validator', () => {
    // Documented difference: a missing required field with a default is rejected here,
    // where the runtime validator fills it in first and accepts.
    const defaultsSchema: RJSFSchema = {
      $id: 'defaults',
      type: 'object',
      properties: { a: { type: 'string', default: 'hi' } },
      required: ['a'],
    };
    const fns = loadModule(compileSchemaValidatorsCode(defaultsSchema));
    expect(fns.defaults({})).toBe(false);
    expect(fns.defaults({ a: 'hi' })).toBe(true);
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
    expect(errors.map((e) => e.property ?? '').sort()).toEqual(['.also', '.bad']);
  });
  precompiledCoverageTests((rootSchema, options) =>
    createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema, options)), rootSchema, options),
  );
  nestedResourceTests((rootSchema) =>
    createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema),
  );
});
