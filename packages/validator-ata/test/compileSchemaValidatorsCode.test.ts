import type { RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils } from '@rjsf/utils';
import type { Validator } from 'ata-validator';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { MockInstance } from 'vitest';

import nestedResourceTests, { mergedResourceViewTests } from '../../utils/test/testUtils/nestedResourceTests.ts';
import pointerValidationTests, {
  sharedObjectValidationTests,
  sharedSubschemaValidationTests,
} from '../../utils/test/testUtils/pointerValidationTests.ts';
import precompiledCoverageTests from '../../utils/test/testUtils/precompiledCoverageTests.ts';
import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import type { CustomValidatorOptionsType } from '../src/index.ts';
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
        /entries without an \$id are left out of the precompiled module; ata needs an \$id to register one, so the runtime validator rejects them too/,
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
    let warn: MockInstance<typeof console.warn>;
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
      const runtime = customizeValidator(options).isValid(form, data, form);
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

    test.each(withDollarId.map(([id]) => id))("compiles ata's own copy of %s in, with a warning", (id) => {
      expect(compileSchemaValidatorsCode(schema, { additionalMetaSchemas: [METASCHEMAS.get(id)!] })).not.toBe(
        compileSchemaValidatorsCode(schema),
      );
      expect(warn.mock.calls.flat().join('\n')).toContain(id);
    });

    test('registers a draft-04 id in ataOptionsOverrides.schemas, as the runtime validator does', () => {
      const d4 = { $schema: 'http://json-schema.org/draft-04/schema#', id: 'https://e.com/d4', maxLength: 2 };
      const options = { ataOptionsOverrides: { schemas: [d4] } };
      expect(agree(refersTo('https://e.com/d4'), { x: 'abc' }, options)).toBe(true);
      expect(agree(refersTo('https://e.com/d4'), { x: 'ab' }, options)).toBe(false);
    });

    test('leaves out an extra with only a fragment $id, which no $ref reaches at runtime', () => {
      // ata keeps it under `#frag`, but `$ref: '#frag'` is read as a fragment of the referring
      // document, so the runtime validator never applies it, from the root or a sub-schema.
      const frag = { $id: '#frag', maxLength: 2 };
      const form = { type: 'object', properties: { x: { type: 'string', not: { $ref: '#frag' } } } } as RJSFSchema;
      const sub = { type: 'string', not: { $ref: '#frag' } } as RJSFSchema;
      for (const options of [
        { additionalMetaSchemas: [frag] },
        { ataOptionsOverrides: { schemas: [frag] } },
        { ataOptionsOverrides: { schemas: { 'urn:k': frag } } },
      ]) {
        const runtime = customizeValidator(options);
        expect(runtime.isValid(form, { x: 'ab' }, form)).toBe(true);
        expect(runtime.isValid(sub, 'ab', form)).toBe(true);
      }
      expect(compileSchemaValidatorsCode(schema, { additionalMetaSchemas: [frag] })).toBe(
        compileSchemaValidatorsCode(schema),
      );
      expect(compileSchemaValidatorsCode(schema, { ataOptionsOverrides: { schemas: [frag] } })).toBe(
        compileSchemaValidatorsCode(schema),
      );
    });

    test('leaves out a list entry that is not an object, with a warning', () => {
      // ata cannot give a boolean an $id in a list, so the runtime validator rejects it too.
      // Entries the options type rules out, which callers can still pass
      const options = {
        additionalMetaSchemas: [false],
        ataOptionsOverrides: { schemas: [true] },
      } as unknown as CustomValidatorOptionsType;
      expect(compileSchemaValidatorsCode(schema, options)).toBe(compileSchemaValidatorsCode(schema));
      expect(warn.mock.calls.flat().join('\n')).toMatch(/entries without an \$id are left out/);
    });

    // The runtime validator for the root, the runtime validator for a sub-schema of it, and the
    // module: all three answer the same.
    const threeWay = (
      form: RJSFSchema,
      sub: RJSFSchema,
      formData: unknown,
      subData: unknown,
      options: CustomValidatorOptionsType,
    ) => {
      const runtime = customizeValidator(options);
      const root = runtime.isValid(form, formData, form);
      const subAnswer = customizeValidator(options).isValid(sub, subData, form);
      const module = loadModule(compileSchemaValidatorsCode(form, options))[form.$id as string](formData);
      expect([subAnswer, module]).toEqual([root, root]);
      return root;
    };
    const notRef = (ref: string) => ({ type: 'string', not: { $ref: ref } }) as RJSFSchema;
    const formWith = (id: string, ref: string, extra: object = {}) =>
      ({ $id: id, type: 'object', properties: { x: notRef(ref) }, ...extra }) as RJSFSchema;

    // Where a reference is registered nowhere, the runtime validators agree with each other and the
    // module declines to answer for that schema rather than give an answer of its own.
    const unresolved = (
      form: RJSFSchema,
      sub: RJSFSchema,
      formData: unknown,
      subData: unknown,
      options: CustomValidatorOptionsType,
    ) => {
      const root = customizeValidator(options).isValid(form, formData, form);
      expect(customizeValidator(options).isValid(sub, subData, form)).toBe(root);
      const fns = loadModule(compileSchemaValidatorsCode(form, options));
      expect(() => fns[form.$id as string](formData)).toThrow(/was not compiled to a standalone validator/);
    };

    test('reads draft-04 by the spellings ata does, http only', () => {
      const options = { ataOptionsOverrides: { schemas: { k: { id: 'urn:x', maxLength: 2 } } } };
      // Under the https spelling ata does not read the entry as draft-04, so `urn:x` is not registered.
      unresolved(
        formWith('f2', 'urn:x', { $schema: 'https://json-schema.org/draft-04/schema#' }),
        notRef('urn:x'),
        { x: 'a' },
        'a',
        options,
      );
      expect(
        threeWay(
          formWith('f2', 'urn:x', { $schema: 'http://json-schema.org/draft-04/schema#' }),
          notRef('urn:x'),
          { x: 'a' },
          'a',
          options,
        ),
      ).toBe(false);
    });

    test('does not take a draft-04 id next to a $ref, as ata does not', () => {
      const options = {
        ataOptionsOverrides: { schemas: { k: { id: 'urn:y', $ref: 'urn:z' }, 'urn:z': { maxLength: 2 } } },
      };
      unresolved(
        formWith('f3', 'urn:y', { $schema: 'http://json-schema.org/draft-04/schema#' }),
        notRef('urn:y'),
        { x: 'a' },
        'a',
        options,
      );
    });

    test('leaves out a record entry that is not a schema', () => {
      // Entries the options type rules out, which callers can still pass
      const options = {
        ataOptionsOverrides: { schemas: { k: null, 'urn:m': { maxLength: 2 } } },
      } as unknown as CustomValidatorOptionsType;
      expect(() => compileSchemaValidatorsCode(schema, options)).not.toThrow();
      threeWay(formWith('f4', 'urn:m'), notRef('urn:m'), { x: 'abc' }, 'abc', options);
    });

    test("lets the form's schema win over an additionalMetaSchemas entry with its $id, in every validator", () => {
      const form = {
        $id: 'http://e/f',
        definitions: { n: { type: 'integer' } },
        type: 'object',
        properties: { x: { not: { $ref: 'http://e/f#/definitions/n' } } },
      } as unknown as RJSFSchema;
      const options = { additionalMetaSchemas: [{ $id: 'http://e/f', definitions: { n: { type: 'string' } } }] };
      expect(threeWay(form, { not: { $ref: 'http://e/f#/definitions/n' } }, { x: 'a' }, 'a', options)).toBe(true);
    });

    test('compiles a record entry under the empty key by its own $id, without the missing-$id warning', () => {
      const options = { ataOptionsOverrides: { schemas: { '': { $id: 'http://x', maxLength: 2 } } } };
      expect(compileSchemaValidatorsCode(schema, options)).not.toBe(compileSchemaValidatorsCode(schema));
      expect(warn.mock.calls.flat().join('\n')).not.toMatch(/entries without an \$id/);
      threeWay(formWith('f5', 'http://x'), notRef('http://x'), { x: 'abc' }, 'abc', options);
    });

    test('gives the size in bytes, not characters', () => {
      const doc = { $id: 'https://json-schema.org/draft/next/schema', description: 'çok güzel' };
      compileSchemaValidatorsCode(schema, { additionalMetaSchemas: [doc] });
      const bytes = new TextEncoder().encode(JSON.stringify(doc)).length;
      expect(bytes).toBeGreaterThan(JSON.stringify(doc).length);
      expect(warn.mock.calls.flat().join('\n')).toContain(`(${bytes} bytes of JSON)`);
    });

    test('registers a draft-04 id only where the entry is read as draft-04', () => {
      // Under a draft-04 form an entry without a $schema of its own is read as draft-04 too.
      const d4Form = { ...refersTo('urn:x'), $schema: 'http://json-schema.org/draft-04/schema#' } as RJSFSchema;
      const inherited = { ataOptionsOverrides: { schemas: [{ id: 'urn:x', maxLength: 2 }] } };
      expect(agree(d4Form, { x: 'abc' }, inherited)).toBe(true);
      expect(agree(d4Form, { x: 'ab' }, inherited)).toBe(false);
      // Elsewhere ata cannot register it: the module leaves it out with a warning instead of throwing.
      expect(() => compileSchemaValidatorsCode(schema, inherited)).not.toThrow();
    });

    test('keeps a boolean record entry what it is', () => {
      // rjsf's types take only objects in `schemas`; ata takes boolean schemas too.
      // Entries the options type rules out, which callers can still pass
      const options = {
        ataOptionsOverrides: { schemas: { 'urn:never': false, 'urn:any': true } },
      } as unknown as CustomValidatorOptionsType;
      expect(agree(refersTo('urn:never'), { x: 'a' }, options)).toBe(true);
      expect(agree(refersTo('urn:any'), { x: 'a' }, options)).toBe(false);
    });

    test("leaves out an extra with the $id of one of the form's schemas, which wins at runtime", () => {
      const form = { $id: 'root', type: 'object', properties: { n: { type: 'integer' } } } as RJSFSchema;
      const stale = { $id: 'root', type: 'object', properties: { n: { type: 'string' } } };
      expect(compileSchemaValidatorsCode(form, { ataOptionsOverrides: { schemas: [stale] } })).toBe(
        compileSchemaValidatorsCode(form),
      );
      expect(agree(form, { n: 1 }, { ataOptionsOverrides: { schemas: [stale] } })).toBe(true);
    });

    test('gives the size of a small json-schema.org document in its warning', () => {
      const next = { $id: 'https://json-schema.org/draft/next/schema', $vocabulary: {} };
      compileSchemaValidatorsCode(schema, { additionalMetaSchemas: [next] });
      const message = warn.mock.calls.flat().join('\n');
      expect(message).toMatch(/draft\/next\/schema is compiled into the precompiled module \(\d+ bytes of JSON\)/);
      expect(message).not.toMatch(/92 KB/);
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
  const precompiledFor = (rootSchema: RJSFSchema) =>
    createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
  nestedResourceTests(precompiledFor);
  mergedResourceViewTests(precompiledFor, false);
});
