import type { RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils } from '@rjsf/utils';
import type { Validator } from 'ata-validator';

import nestedResourceTests from '../../utils/test/testUtils/nestedResourceTests.ts';
import pointerValidationTests, {
  sharedObjectValidationTests,
  sharedSubschemaValidationTests,
} from '../../utils/test/testUtils/pointerValidationTests.ts';
import precompiledCoverageTests from '../../utils/test/testUtils/precompiledCoverageTests.ts';
import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import { createPrecompiledValidator, customizeValidator } from '../src/index.ts';
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
    createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema, options),
  );
  pointerValidationTests((rootSchema) =>
    createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema),
  );
  sharedObjectValidationTests((compiledFrom, runWith) =>
    createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(compiledFrom)), runWith),
  );
  sharedSubschemaValidationTests((compiledFrom, runWith) =>
    createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(compiledFrom)), runWith),
  );
  test('compiles an option whose $ref leads to a boolean schema as what the boolean says', () => {
    for (const value of [true, false]) {
      const rootSchema: RJSFSchema = {
        properties: { b: value, v: { anyOf: [{ $ref: '#/properties/b' }, { type: 'string' }] } },
      };
      const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
      expect(validator.isValid({ $ref: '#/properties/v/anyOf/0' }, 1, rootSchema)).toBe(value);
    }
  });
  test('names the subschemas a schema reaches apart from the definitions of the root', () => {
    const rootSchema: RJSFSchema = {
      definitions: { 'rjsf:0': { type: 'number' } },
      type: 'object',
      properties: {
        n: { $ref: '#/definitions/rjsf:0' },
        s: { type: 'string' },
        v: { anyOf: [{ properties: { a: { $ref: '#/properties/s' }, b: { $ref: '#/properties/n' } } }, true] },
      },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    const option = { $ref: '#/properties/v/anyOf/0' };
    expect(validator.isValid(option, { a: 'x', b: 1 }, rootSchema)).toBe(true);
    expect(validator.isValid(option, { a: 1 }, rootSchema)).toBe(false);
    expect(validator.isValid(option, { b: 'x' }, rootSchema)).toBe(false);
  });
  test('reads a $ref below an option with an $id of its own against that option', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: {
        v: {
          anyOf: [
            {
              $id: 'http://example.com/A.json',
              type: 'object',
              properties: { j: { type: 'string' }, k: { $ref: '#/properties/j' } },
            },
            true,
          ],
        },
      },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    const option = { $ref: '#/properties/v/anyOf/0' };
    expect(validator.isValid(option, { k: 'x' }, rootSchema)).toBe(true);
    expect(validator.isValid(option, { k: 1 }, rootSchema)).toBe(false);
  });
  test('leaves a $ref that names no subschema of the resource around it as it is, which ata does not compile', () => {
    const rootSchema: RJSFSchema = {
      definitions: { j: { type: 'string' } },
      type: 'object',
      properties: {
        v: {
          anyOf: [
            { $id: 'http://example.com/A.json', type: 'object', properties: { k: { $ref: '#/definitions/j' } } },
            true,
          ],
        },
      },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(() => validator.isValid({ $ref: '#/properties/v/anyOf/0' }, {}, rootSchema)).toThrow(
      'was not compiled to a standalone validator',
    );
  });
  test('leaves a $ref that is not local to the root as it is', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: {
        v: { anyOf: [{ properties: { u: { $ref: 'http://example.com/other.json' } } }, { type: 'number' }] },
      },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(validator.isValid({ $ref: '#/properties/v/anyOf/1' }, 1, rootSchema)).toBe(true);
    expect(() => validator.isValid({ $ref: '#/properties/v/anyOf/0' }, {}, rootSchema)).toThrow(
      'was not compiled to a standalone validator',
    );
  });
  test('compiles a $ref beside keywords that assert something as an allOf entry beside them', () => {
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $defs: {
        Base: { type: 'object', properties: { id: { type: 'string' } } },
        Ext: { $ref: '#/$defs/Base', properties: { more: { type: 'number' } }, allOf: [{ required: ['id'] }] },
      },
      type: 'object',
      properties: {
        v: { anyOf: [{ $ref: '#/$defs/Ext' }, { type: 'object', properties: { other: { type: 'string' } } }] },
        w: { $ref: '#/properties/v', title: 'W', properties: { x: { type: 'boolean' } } },
      },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(validator.isValid({ $ref: '#/properties/v/anyOf/1' }, { other: 'o' }, rootSchema)).toBe(true);
    expect(validator.isValid({ $ref: '#/properties/v/anyOf/0' }, { id: 'a', more: 1 }, rootSchema)).toBe(true);
    expect(validator.isValid({ $ref: '#/properties/v/anyOf/0' }, { id: 1 }, rootSchema)).toBe(false);
    expect(validator.isValid({ $ref: '#/properties/v/anyOf/0' }, { more: 1 }, rootSchema)).toBe(false);
    const { errors } = validator.validateFormData({ w: { id: 'a', more: 'm', x: 1 } }, rootSchema);
    expect(errors.map((error) => error.property)).toEqual(['.w.x']);
  });
  test('compiles a root holding an option with an $id of its own, which ata compiles nothing for as it stands', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: {
        p: {
          oneOf: [
            { $id: 'myOption', type: 'object', additionalProperties: { type: 'string' } },
            { type: 'object', properties: { n: { type: 'number' } }, required: ['n'] },
          ],
        },
      },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(validator.validateFormData({ p: { n: 1 } }, rootSchema).errors).toEqual([]);
    expect(validator.isValid(rootSchema, { p: [] }, rootSchema)).toBe(false);
  });
  test('resolves a $ref spelled with the absolute $id of the resource around it as one local to it', () => {
    const options: RJSFSchema[] = [
      { $ref: 'http://example.com/root.json#/definitions/A' },
      { $ref: 'http://example.com/root.json#/definitions/B' },
    ];
    const rootSchema: RJSFSchema = {
      $id: 'http://example.com/root.json',
      definitions: {
        n: { type: 'number' },
        A: { type: 'object', properties: { k: { const: 'a' } }, required: ['k'] },
        B: { type: 'object', properties: { k: { const: 'b' } }, required: ['k'] },
      },
      type: 'object',
      properties: { a: { $ref: 'http://example.com/root.json#/definitions/n' }, v: { oneOf: options } },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    const schemaUtils = createSchemaUtils({ validator }, rootSchema);
    expect(validator.validateFormData({ a: 5, v: { k: 'b' } }, rootSchema).errors).toEqual([]);
    expect(validator.isValid(rootSchema, { a: 'x' }, rootSchema)).toBe(false);
    expect(schemaUtils.getFirstMatchingOption({ k: 'b' }, options)).toBe(1);
  });
  describe('resolves a $ref naming a resource of the root by a URI', () => {
    const definitions: Record<string, RJSFSchema> = {
      A: { type: 'object', properties: { k: { type: 'string', pattern: '^a' } }, required: ['k'] },
      B: { type: 'object', properties: { k: { type: 'string', pattern: '^b' } }, required: ['k'] },
    };
    const naming = (document: string): RJSFSchema => ({
      $id: 'http://example.com/x/a.json',
      definitions,
      type: 'object',
      properties: {
        v: { oneOf: [{ $ref: `${document}#/definitions/A` }, { $ref: `${document}#/definitions/B` }] },
      },
    });
    test.each<[string, RJSFSchema]>([
      ['relative to the root', naming('a.json')],
      ['with its host in another case', naming('http://EXAMPLE.com/x/a.json')],
      ['through dot segments', naming('http://example.com/x/../x/a.json')],
      ['with an unreserved character percent-encoded', naming('http://example.com/x/%61.json')],
      [
        'of a resource nested in the root',
        {
          $id: 'http://example.com/a.json',
          type: 'object',
          properties: {
            n: { $id: 'http://example.com/n.json', definitions },
            v: { oneOf: [{ $ref: 'n.json#/definitions/A' }, { $ref: 'n.json#/definitions/B' }] },
          },
        },
      ],
    ])('%s', (_name, rootSchema) => {
      const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
      expect(validator.validateFormData({ v: { k: 'b' } }, rootSchema).errors).toEqual([]);
      expect(validator.isValid(rootSchema, { v: { k: 'c' } }, rootSchema)).toBe(false);
    });
  });
  test('resolves a $ref to an anchor to the subschema carrying it', () => {
    const n: RJSFSchema = { $anchor: 'nodeA', type: 'number' };
    const s: RJSFSchema = { $anchor: 'nodeS', type: 'string' };
    const options: RJSFSchema[] = [{ $ref: '#nodeS' }, { $ref: '#nodeA' }];
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $defs: { n, s },
      type: 'object',
      properties: { a: { $ref: '#nodeA' }, u: { oneOf: options } },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    const schemaUtils = createSchemaUtils({ validator }, rootSchema);
    expect(validator.validateFormData({ a: 5 }, rootSchema).errors).toEqual([]);
    expect(validator.isValid(rootSchema, { a: 'x' }, rootSchema)).toBe(false);
    expect(schemaUtils.getFirstMatchingOption(5, options)).toBe(1);
  });
  test('leaves a $ref to an anchor of a resource nested in the one around it as it is', () => {
    const inner: RJSFSchema = { $id: 'http://example.com/inner.json', $anchor: 'inner', type: 'number' };
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $defs: { inner },
      properties: { i: { $ref: '#inner' } },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(() => validator.isValid(rootSchema, { i: 5 }, rootSchema)).toThrow(
      'was not compiled to a standalone validator',
    );
  });
  test('resolves a $ref to a draft-07 anchor, an $id that is only a fragment', () => {
    const rootSchema: RJSFSchema = {
      definitions: { n: { $id: '#nodeA', type: 'number' } },
      type: 'object',
      properties: { a: { $ref: '#nodeA' } },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(validator.isValid(rootSchema, { a: 5 }, rootSchema)).toBe(true);
    expect(validator.isValid(rootSchema, { a: 'x' }, rootSchema)).toBe(false);
  });
  test('leaves a $ref key in the data a const, an enum, a default or examples hold as it is', () => {
    const value = { $ref: '#/definitions/n' };
    const rootSchema: RJSFSchema = {
      definitions: { n: { type: 'number' } },
      type: 'object',
      properties: {
        c: { const: value },
        e: { enum: [value] },
        d: { type: 'object', default: value, examples: [value] },
      },
    };
    const code = compileSchemaValidatorsCode(rootSchema);
    const validator = createPrecompiledValidator(loadModule(code), rootSchema);
    expect(validator.validateFormData({ c: value, e: value, d: value }, rootSchema).errors).toEqual([]);
    expect(validator.isValid(rootSchema, { c: { $ref: '#/definitions/rjsf:0' } }, rootSchema)).toBe(false);
  });
  test('compiles a schema holding only annotations, which ata compiles no validator for as it stands', () => {
    const rootSchema: RJSFSchema = { title: 'Anything' };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(validator.isValid(rootSchema, 1, rootSchema)).toBe(true);
  });
  test("compiles a pointer under the root's $schema, as the live validator reads the subschema in the root", () => {
    const rootSchema: RJSFSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        v: {
          anyOf: [{ type: 'array', items: [{ type: 'string' }], additionalItems: false }, { type: 'number' }],
        },
      },
    };
    const live = customizeValidator();
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    const pointer: RJSFSchema = { $ref: '#/properties/v/anyOf/0' };
    expect(live.isValid(pointer, ['x', 1], rootSchema)).toBe(false);
    expect(validator.isValid(pointer, ['x', 1], rootSchema)).toBe(false);
    expect(validator.isValid(pointer, ['x'], rootSchema)).toBe(true);
  });
  test('reads the keywords beside a $ref under a draft-07 root as the live validator reads them', () => {
    const rootSchema: RJSFSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: { s: { type: 'string' } },
      type: 'object',
      properties: {
        p: { $ref: '#/definitions/s', enum: ['ab'] },
        v: { anyOf: [{ $ref: '#/properties/p' }, { type: 'number' }] },
      },
    };
    const live = customizeValidator();
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(live.validateFormData({ p: 'xyz' }, rootSchema).errors).toEqual([]);
    expect(validator.validateFormData({ p: 'xyz' }, rootSchema).errors).toEqual([]);
    expect(validator.isValid({ $ref: '#/properties/v/anyOf/0' }, 'xyz', rootSchema)).toBe(true);
    expect(validator.isValid({ $ref: '#/properties/v/anyOf/0' }, 5, rootSchema)).toBe(false);
  });
  test.each([
    ['declaring draft-07', { $schema: 'http://json-schema.org/draft-07/schema#' }],
    ['declaring no dialect', {}],
  ])(
    'reads a $ref beside an $id under a root %s against the resource around them, as the form does',
    (_name, dialect) => {
      const rootSchema: RJSFSchema = {
        ...dialect,
        definitions: { a: { type: 'string' } },
        type: 'object',
        properties: { p: { $id: 'http://example.com/x.json', $ref: '#/definitions/a' } },
      };
      const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
      expect(validator.validateFormData({ p: 'x' }, rootSchema).errors).toEqual([]);
      expect(validator.validateFormData({ p: 5 }, rootSchema).errors.map((error) => error.property)).toEqual(['.p']);
    },
  );
  test.each([
    ['a pointer holding a % that starts no escape', '#/definitions/100%'],
    ['an anchor holding a % that starts no escape', '#100%'],
    ['a pointer through a boolean subschema', '#/properties/t/type'],
  ])('compiles a root holding a $ref that names nothing in it: %s', (_name, ref) => {
    const rootSchema: RJSFSchema = {
      definitions: { '100%': { type: 'string' } },
      type: 'object',
      properties: { p: { type: 'string', not: { $ref: ref } }, t: true, q: { type: 'number' } },
    };
    expect(() => compileSchemaValidatorsCode(rootSchema)).not.toThrow();
  });
  test('reads a $ref below an $id under a container no keyword names against the resource around the container', () => {
    const rootSchema: RJSFSchema = {
      components: {
        schemas: {
          X: { $id: 'http://example.com/y.json', type: 'object', properties: { k: { $ref: '#/definitions/s' } } },
        },
      },
      definitions: { s: { type: 'string' } },
      type: 'object',
      properties: { o: { anyOf: [{ $ref: '#/components/schemas/X/properties/k' }, { type: 'boolean' }] } },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(validator.isValid({ $ref: '#/properties/o/anyOf/0' }, 'x', rootSchema)).toBe(true);
    expect(validator.isValid({ $ref: '#/properties/o/anyOf/0' }, 5, rootSchema)).toBe(false);
  });
  test('compiles a root it carries through $ref: "#" that holds a definition naming another', () => {
    const rootSchema: RJSFSchema = {
      definitions: { Name: { $ref: '#/definitions/Str' }, Str: { type: 'string' } },
      type: 'object',
      properties: { name: { $ref: '#/definitions/Name' }, children: { type: 'array', items: { $ref: '#' } } },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(validator.validateFormData({ name: 'a', children: [{ name: 'b' }] }, rootSchema).errors).toEqual([]);
    expect(
      validator
        .validateFormData({ name: 'a', children: [{ name: 5 }] }, rootSchema)
        .errors.map((error) => error.property),
    ).toEqual(['.children.0.name']);
  });
  nestedResourceTests((rootSchema) =>
    createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema),
  );
});
