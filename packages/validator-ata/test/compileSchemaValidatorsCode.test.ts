import type { RJSFSchema } from '@rjsf/utils';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import { createPrecompiledValidator, customizeValidator } from '../src/index.ts';

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

  test('warns once about options the generated module cannot carry, and still compiles', async () => {
    // A fresh copy of the module, so a warning an earlier test happened to log is not already marked as shown.
    vi.resetModules();
    const { compileSchemaValidatorsCode } = await import('../src/compileSchemaValidatorsCode.ts');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const options = {
        ataOptionsOverrides: { coerceTypes: true, removeAdditional: true },
        additionalMetaSchemas: [{ type: 'string' }, { $id: '', type: 'string' }],
        extenderFn: (v: any) => v,
      };
      const code = compileSchemaValidatorsCode(schema, options);
      expect(typeof loadModule(code).root).toBe('function');
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn.mock.calls[0][0]).toMatch(
        /entries without an \$id are left out of the precompiled module; ata needs an \$id to register one/,
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

  describe('extra schemas and meta-schemas', () => {
    // These compile official meta-schemas, which warns; the warnings are expected and kept out of
    // the test output.
    let warn: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warn.mockRestore();
    });

    // ata's own copies of the official meta-schemas, read from its file by path since ata does not
    // export them, so these tests follow whatever the installed ata ships. lib/metaschemas.js is not
    // public API (ata-validator 1.56.0 has it): it is read in a `try`, so a later ata that moves it
    // fails the test right below, not every test in this file.
    let METASCHEMAS = new Map<string, Record<string, unknown>>();
    let metaSchemasError: unknown;
    try {
      const requireHere = createRequire(import.meta.url);
      ({ METASCHEMAS } = requireHere(
        join(dirname(requireHere.resolve('ata-validator/package.json')), 'lib', 'metaschemas.js'),
      ) as { METASCHEMAS: Map<string, Record<string, unknown>> });
    } catch (error) {
      metaSchemasError = error;
    }
    const shipped = [...METASCHEMAS];
    // draft-04's copy names itself with `id`, not `$id`, so it is not a document a caller can pass in.
    const withDollarId = shipped.filter(([, doc]) => typeof doc.$id === 'string');
    // Each id under http and https, with and without a trailing `#`.
    const forms = (id: string) => {
      const bare = id.replace(/#$/, '').replace(/^https?:/, '');
      return ['http:', 'https:'].flatMap((scheme) => [`${scheme}${bare}`, `${scheme}${bare}#`]);
    };

    // The runtime validator and the module, on the same form, data and options.
    const agree = (form: RJSFSchema, data: unknown, options: Parameters<typeof compileSchemaValidatorsCode>[1]) => {
      const runtime = customizeValidator(options).isValid(form, data as any, form);
      const module = loadModule(compileSchemaValidatorsCode(form, options))[form.$id as string](data);
      expect(module).toBe(runtime);
      return module;
    };
    // A form that reaches the document under `id` through `not`, where `schemaParser` leaves the
    // `$ref` for the validator to resolve.
    const refersTo = (id: string): RJSFSchema => ({
      $id: 'refers',
      type: 'object',
      properties: { x: { type: 'string', not: { $ref: id } } },
    });

    test("reads ata's own meta-schemas from lib/metaschemas.js", () => {
      expect(metaSchemasError).toBeUndefined();
      expect(METASCHEMAS.size).toBeGreaterThan(0);
    });

    test.each(withDollarId.map(([id]) => id))("compiles ata's own copy of %s in, with a warning", async (id) => {
      // A fresh copy of the module, so a warning an earlier test logged is not already marked as shown.
      vi.resetModules();
      const { compileSchemaValidatorsCode: compileFresh } = await import('../src/compileSchemaValidatorsCode.ts');
      expect(compileFresh(schema, { additionalMetaSchemas: [METASCHEMAS.get(id)!] })).not.toBe(compileFresh(schema));
      expect(warn.mock.calls.flat().join('\n')).toContain(id);
    });

    test('registers a draft-04 id in ataOptionsOverrides.schemas, as the runtime validator does', () => {
      const d4 = { $schema: 'http://json-schema.org/draft-04/schema#', id: 'https://e.com/d4', maxLength: 2 };
      const options = { ataOptionsOverrides: { schemas: [d4] } };
      expect(agree(refersTo('https://e.com/d4'), { x: 'abc' }, options)).toBe(true);
      expect(agree(refersTo('https://e.com/d4'), { x: 'ab' }, options)).toBe(false);
    });

    test('compiles an extra with a fragment $id in, as ata registers it', () => {
      const frag = { $id: '#frag', type: 'string' };
      expect(compileSchemaValidatorsCode(schema, { additionalMetaSchemas: [frag] })).not.toBe(
        compileSchemaValidatorsCode(schema),
      );
    });

    test.each(shipped.flatMap(([id]) => forms(id)))(
      'answers as the runtime validator for a different document under %s',
      (id) => {
        // Under `not`, the caller's document makes 'abc' valid and 'ab' invalid.
        const options = { additionalMetaSchemas: [{ $id: id, maxLength: 2 }] };
        expect(agree(refersTo(id), { x: 'abc' }, options)).toBe(true);
        expect(agree(refersTo(id), { x: 'ab' }, options)).toBe(false);
      },
    );

    test.each(withDollarId.flatMap(([id]) => forms(id)))(
      "answers as the runtime validator for ata's copy under %s",
      (id) => {
        const doc = METASCHEMAS.get(shipped.find(([shippedId]) => forms(shippedId).includes(id))![0])!;
        const options = { additionalMetaSchemas: [{ ...doc, $id: id }] };
        agree(refersTo(id), { x: 'abc' }, options);
      },
    );

    test('answers as the runtime validator when two extras share a shipped $id', () => {
      // At runtime `additionalMetaSchemas` is added last, so ata's copy there replaces the other one.
      const draft07Id = 'http://json-schema.org/draft-07/schema#';
      const draft07 = METASCHEMAS.get(draft07Id)!;
      const other = { $id: draft07Id, maxLength: 2 };
      const form = refersTo(draft07Id);
      for (const options of [
        { additionalMetaSchemas: [draft07], ataOptionsOverrides: { schemas: [other] } },
        { additionalMetaSchemas: [other, draft07] },
        { additionalMetaSchemas: [draft07, other] },
      ]) {
        agree(form, { x: 'ab' }, options);
        agree(form, { x: 'abc' }, options);
      }
    });

    test('answers as the runtime validator when another extra refers to a shipped document', () => {
      // ata loads its own copy only for a form that refers to it itself, so a copy reached through
      // another document must stay in the module.
      const draft07 = METASCHEMAS.get('http://json-schema.org/draft-07/schema#')!;
      const a = { $id: 'https://example.com/a', not: { $ref: 'http://json-schema.org/draft-07/schema#' } };
      const form: RJSFSchema = {
        $id: 'f',
        type: 'object',
        properties: { x: { not: { $ref: 'https://example.com/a' } } },
      };
      const options = { additionalMetaSchemas: [draft07, a] };
      expect(agree(form, { x: { type: 42 } }, options)).toBe(false);
      expect(agree(form, { x: { type: 'string' } }, options)).toBe(true);
    });

    test('answers as the runtime validator for a copy reached only through $schema', () => {
      // 2019-09 has no prefixItems, so its $vocabulary strips the keyword at runtime.
      const id = 'https://json-schema.org/draft/2019-09/schema';
      // `prefixItems` is not in rjsf's draft-07 schema type.
      const form = {
        $id: 'f',
        $schema: id,
        type: 'object',
        properties: { a: { type: 'array', prefixItems: [{ type: 'string' }] } },
      } as RJSFSchema;
      agree(form, { a: [1] }, { additionalMetaSchemas: [METASCHEMAS.get(id)!] });
    });

    test('answers as the runtime validator for a reference under a nested $id', () => {
      const a = {
        $id: 'https://example.com/a',
        $defs: { d: { $id: 'http://json-schema.org/draft-07/', not: { $ref: 'schema#' } } },
      };
      const form: RJSFSchema = {
        $id: 'f',
        type: 'object',
        // Under `not`, which schemaParser leaves for the validator to resolve.
        properties: { x: { not: { $ref: 'https://example.com/a#/$defs/d' } } },
      };
      const options = { additionalMetaSchemas: [METASCHEMAS.get('http://json-schema.org/draft-07/schema#')!, a] };
      agree(form, { x: { type: 42 } }, options);
      agree(form, { x: { type: 'string' } }, options);
    });

    test('answers as the runtime validator for a meta-schema in ataOptionsOverrides.schemas and a form without an $id', () => {
      const meta = {
        $id: 'https://example.com/loose',
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $vocabulary: { 'https://json-schema.org/draft/2020-12/vocab/applicator': true },
      };
      const form: RJSFSchema = {
        $schema: 'https://example.com/loose',
        type: 'object',
        properties: { n: { type: 'number', minimum: 5 } },
      };
      const options = { ataOptionsOverrides: { schemas: [meta] } };
      const runtime = customizeValidator(options).isValid(form, { n: 1 }, form);
      const fns = loadModule(compileSchemaValidatorsCode(form, options));
      const validator = createPrecompiledValidator(fns, form);
      expect(validator.isValid(form, { n: 1 }, form)).toBe(runtime);
      expect(runtime).toBe(true);
    });

    test.each([
      'https://json-schema.org/draft/next/schema',
      'https://json-schema.org/draft/2020-12/schema',
      'http://json-schema.org/draft/2020-12/schema#',
    ])('answers as the runtime validator for a meta-schema at %s with its own $vocabulary', (id) => {
      // Without the validation vocabulary `minimum` is not checked, so { n: 1 } is valid at runtime.
      const meta = {
        $id: id,
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $vocabulary: { 'https://json-schema.org/draft/2020-12/vocab/applicator': true },
      };
      const loose: RJSFSchema = {
        $id: 'loose',
        $schema: id,
        type: 'object',
        properties: { n: { type: 'number', minimum: 5 } },
      };
      expect(agree(loose, { n: 1 }, { additionalMetaSchemas: [meta] })).toBe(true);
    });
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
    expect(errors.map((e) => e.property).sort()).toEqual(['.also', '.bad']);
  });
});
