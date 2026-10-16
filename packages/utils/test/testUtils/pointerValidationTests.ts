import type { RJSFSchema, ValidatorType } from '../../src/index.ts';
import { createSchemaUtils, getDefaultFormState, isObject } from '../../src/index.ts';

/** Returns the `anyOf`/`oneOf` options of the `schema`'s own keyword `key` */
function optionsOf(schema: RJSFSchema | boolean | undefined, key: 'anyOf' | 'oneOf'): RJSFSchema[] {
  const options = isObject(schema) ? schema[key] : undefined;
  return Array.isArray(options) ? options.filter(isObject) : [];
}

/** Runs the cases where what a form hands a validator, a pointer into the root or a copy scoring derives, depends on
 * the validator resolving it as JSON Schema does. Each validator package runs them against its live validator and,
 * where it has one, its precompiled one.
 *
 * @param buildValidator - Returns the package's validator for the `rootSchema`
 */
export default function pointerValidationTests(buildValidator: (rootSchema: RJSFSchema) => ValidatorType) {
  describe('validating by pointers into the root', () => {
    it('chooses an option holding only a required by the keys it requires', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { email: { type: 'string' }, phone: { type: 'string' } },
        anyOf: [
          { title: 'By email', required: ['email'] },
          { title: 'By phone', required: ['phone'] },
        ],
      };
      const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
      const options = optionsOf(rootSchema, 'anyOf');
      expect(schemaUtils.getFirstMatchingOption({ phone: '1' }, options)).toBe(1);
      expect(schemaUtils.getClosestMatchingOption({ phone: '1' }, options)).toBe(1);
    });
    it('matches an option written as a $ref, or composed with an allOf, as the option written in place', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          A: { type: 'object', properties: { a: { type: 'number' } }, required: ['a'] },
          B: { type: 'object', properties: { b: { type: 'number' } }, required: ['b'] },
          Base: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        },
        type: 'object',
        properties: {
          refs: { oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] },
          kinds: {
            oneOf: [
              { properties: { kind: { const: 'y' } } },
              { allOf: [{ $ref: '#/definitions/Base' }], properties: { kind: { const: 'x' } } },
            ],
          },
        },
      };
      const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
      const { refs, kinds } = rootSchema.properties ?? {};
      expect(schemaUtils.getFirstMatchingOption({ b: 1 }, optionsOf(refs, 'oneOf'))).toBe(1);
      expect(schemaUtils.getFirstMatchingOption({ kind: 'x' }, optionsOf(kinds, 'oneOf'))).toBe(1);
    });
    it('checks an if that is a $ref into a root carrying an $id against that root', () => {
      const rootSchema: RJSFSchema = {
        $id: 'http://example.com/root.json',
        definitions: { I: { properties: { k: { const: 'x' } } } },
        type: 'object',
        properties: { k: { type: 'string', default: 'x' } },
        if: { $ref: '#/definitions/I' },
        then: { properties: { t: { type: 'string', default: 't' } } },
        else: { properties: { e: { type: 'string', default: 'e' } } },
      };
      const validator = buildValidator(rootSchema);
      expect(getDefaultFormState({ validator }, { schema: rootSchema, rootSchema, formData: { k: 'x' } })).toEqual({
        k: 'x',
        t: 't',
      });
    });
    it("checks an if below a nested $id against that resource's definitions", () => {
      const rootSchema: RJSFSchema = {
        $id: 'http://example.com/root.json',
        definitions: { kind: { const: 'root' } },
        type: 'object',
        properties: {
          n: {
            $id: 'http://example.com/nested.json',
            definitions: { kind: { const: 'nested' } },
            type: 'object',
            properties: { kind: { type: 'string' } },
            if: { properties: { kind: { $ref: '#/definitions/kind' } }, required: ['kind'] },
            then: { properties: { t: { type: 'string', default: 't' } } },
            else: { properties: { e: { type: 'string', default: 'e' } } },
          },
        },
      };
      const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
      expect(schemaUtils.getDefaultFormState(rootSchema, { n: { kind: 'nested' } })).toEqual({
        n: { kind: 'nested', t: 't' },
      });
      expect(schemaUtils.getDefaultFormState(rootSchema, { n: { kind: 'root' } })).toEqual({
        n: { kind: 'root', e: 'e' },
      });
    });
    it('applies the dependency oneOf option matched on a property whose name ends in #', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { 'Phone #': { type: 'string', enum: ['Home', 'Work'] } },
        dependencies: {
          'Phone #': {
            oneOf: [
              { properties: { 'Phone #': { enum: ['Home'] }, home: { default: 'HOME' } } },
              { properties: { 'Phone #': { enum: ['Work'] }, ext: { default: 'EXT' } } },
            ],
          },
        },
      };
      const validator = buildValidator(rootSchema);
      expect(getDefaultFormState({ validator }, { schema: rootSchema, formData: { 'Phone #': 'Work' } })).toEqual({
        'Phone #': 'Work',
        ext: 'EXT',
      });
    });
    it('reads the $refs below an option with an $id of its own against that $id, with and without a required', () => {
      const option = (name: string, kind: string, required: string[]): RJSFSchema => ({
        $id: `http://example.com/${name}.json`,
        definitions: { kind: { const: kind } },
        type: 'object',
        properties: { kind: { type: 'string' } },
        not: { properties: { kind: { not: { $ref: '#/definitions/kind' } } } },
        required,
      });
      for (const required of [[], ['kind']]) {
        const rootSchema: RJSFSchema = {
          properties: { p: { oneOf: [option('A', 'a', required), option('B', 'b', required)] } },
        };
        const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
        const options = optionsOf(rootSchema.properties?.p, 'oneOf');
        expect(schemaUtils.getFirstMatchingOption({ kind: 'b' }, options)).toBe(1);
        expect(schemaUtils.getClosestMatchingOption({ kind: 'b' }, options)).toBe(1);
      }
    });
    it('applies no dependency oneOf option when the property fits two, one of them declaring it in an allOf entry', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { k: { type: 'string', enum: ['a', 'b'] } },
        dependencies: {
          k: {
            oneOf: [
              {
                allOf: [{ properties: { k: { enum: ['a', 'b'] } } }],
                properties: { ka: { type: 'string', default: 'A' } },
              },
              { properties: { k: { enum: ['b'] }, kb: { type: 'string', default: 'B' } } },
            ],
          },
        },
      };
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      expect(
        getDefaultFormState({ validator: buildValidator(rootSchema) }, { schema: rootSchema, formData: { k: 'b' } }),
      ).toEqual({ k: 'b' });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('ignoring oneOf in dependencies of "k"'));
      warn.mockRestore();
    });
    it('reads a boolean if, and a boolean property of a dependency oneOf option, as what they say', () => {
      const conditional: RJSFSchema = {
        type: 'object',
        if: false,
        then: { properties: { t: { default: 'THEN' } } },
        else: { properties: { e: { default: 'ELSE' } } },
      };
      expect(
        getDefaultFormState({ validator: buildValidator(conditional) }, { schema: conditional, formData: {} }),
      ).toEqual({ e: 'ELSE' });
      const dependent: RJSFSchema = {
        properties: { a: { type: 'string' } },
        dependencies: {
          a: {
            oneOf: [
              { properties: { a: false, one: { default: 'ONE' } } },
              { properties: { a: true, two: { default: 'TWO' } } },
            ],
          },
        },
      };
      expect(
        getDefaultFormState({ validator: buildValidator(dependent) }, { schema: dependent, formData: { a: 'z' } }),
      ).toEqual({ a: 'z', two: 'TWO' });
    });
    it('chooses an option behind a $ref into definitions named with percent-encoded characters', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          'a b': { type: 'object', properties: { k: { const: 'a' }, x: { type: 'string' } } },
          'c%d': { type: 'object', properties: { k: { const: 'b' }, y: { type: 'string' } } },
        },
        type: 'object',
        properties: { v: { oneOf: [{ $ref: '#/definitions/a%20b' }, { $ref: '#/definitions/c%25d' }] } },
      };
      const validator = buildValidator(rootSchema);
      const schemaUtils = createSchemaUtils({ validator }, rootSchema);
      const options = optionsOf(rootSchema.properties?.v, 'oneOf');
      expect(schemaUtils.getFirstMatchingOption({ k: 'b' }, options)).toBe(1);
      expect(schemaUtils.getClosestMatchingOption({ k: 'b' }, options)).toBe(1);
      expect(validator.isValid(rootSchema, { v: { k: 'b' } }, rootSchema)).toBe(true);
    });
    it('chooses an option behind a $ref into definitions of a root holding both definitions and $defs', () => {
      const rootSchema: RJSFSchema = {
        definitions: { A: { type: 'object', properties: { k: { const: 'a' }, x: { type: 'string' } } } },
        $defs: { B: { type: 'object', properties: { k: { const: 'b' }, y: { type: 'string' } } } },
        type: 'object',
        properties: { v: { oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/$defs/B' }] } },
      };
      const validator = buildValidator(rootSchema);
      const schemaUtils = createSchemaUtils({ validator }, rootSchema);
      const options = optionsOf(rootSchema.properties?.v, 'oneOf');
      expect(schemaUtils.getFirstMatchingOption({ k: 'b' }, options)).toBe(1);
      expect(schemaUtils.getClosestMatchingOption({ k: 'b' }, options)).toBe(1);
      expect(validator.isValid(rootSchema, { v: { k: 'b' } }, rootSchema)).toBe(true);
    });
    describe('reads an option declaring its discriminator in an allOf entry beside a $ref to a base declaring it too', () => {
      const pet = (kind: string, petType: RJSFSchema = { const: kind }): RJSFSchema => ({
        allOf: [{ $ref: '#/definitions/Base' }, { properties: { petType, [kind]: { type: 'string' } } }],
      });
      const pets = (cat: RJSFSchema, dog: RJSFSchema): RJSFSchema => ({
        discriminator: { propertyName: 'petType' },
        oneOf: [cat, dog],
      });
      const base = (petType: RJSFSchema, cat: RJSFSchema = pet('cat'), dog: RJSFSchema = pet('dog')): RJSFSchema => ({
        definitions: { Base: { type: 'object', properties: { petType } } },
        type: 'object',
        properties: { pet: pets(cat, dog) },
      });
      const generic: RJSFSchema = { type: 'string' };
      const enumerating: RJSFSchema = { type: 'string', enum: ['cat', 'dog'] };
      it.each([
        ['a generic base', generic],
        ['a base enumerating every kind', enumerating],
      ])('choosing the option whose own declaration holds the value over %s', (_name, petType) => {
        const rootSchema = base(petType);
        const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
        const options = optionsOf(rootSchema.properties?.pet, 'oneOf');
        expect(schemaUtils.getFirstMatchingOption({ petType: 'dog' }, options, 'petType')).toBe(1);
        expect(schemaUtils.getFirstMatchingOption({ petType: 'dog' }, options)).toBe(1);
        expect(schemaUtils.getClosestMatchingOption({ petType: 'dog' }, options, 0, 'petType')).toBe(1);
        expect(schemaUtils.omitExtraData(rootSchema, { pet: { petType: 'dog', dog: 'woof', cat: 'x' } })).toEqual({
          pet: { petType: 'dog', dog: 'woof' },
        });
      });
      it('checking the value against a declaration the validator has to read, a pattern', () => {
        const rootSchema = base(generic, pet('cat', { pattern: '^c' }), pet('dog', { pattern: '^d' }));
        const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
        const options = optionsOf(rootSchema.properties?.pet, 'oneOf');
        expect(schemaUtils.getFirstMatchingOption({ petType: 'dog' }, options, 'petType')).toBe(1);
      });
      it('choosing a dependency oneOf option the same way', () => {
        const kind = (value: string): RJSFSchema => ({
          allOf: [
            { $ref: '#/definitions/Base' },
            { properties: { k: { enum: [value] }, [value]: { type: 'string', default: value.toUpperCase() } } },
          ],
        });
        const rootSchema: RJSFSchema = {
          definitions: {
            Base: { properties: { k: { type: 'string', enum: ['a', 'b'] } } },
            A: kind('a'),
            B: kind('b'),
          },
          type: 'object',
          properties: { k: { type: 'string', enum: ['a', 'b'] } },
          dependencies: { k: { oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] } },
        };
        const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
        expect(schemaUtils.getDefaultFormState(rootSchema, { k: 'b' })).toEqual({ k: 'b', b: 'B' });
      });
    });
  });
}

/** Runs the cases where a form hands a live validator a root whose `$ref`s it made absolute against the root's `$id`.
 * A precompiled validator is compiled from the root as written, and rejects that root as one it was not compiled from.
 *
 * @param buildValidator - Returns the package's live validator
 */
export function absoluteRefValidationTests(buildValidator: () => ValidatorType) {
  describe('validating by pointers into a root whose $refs are absolute', () => {
    it('resolves the $refs of options and an if made absolute against the $id of a 2020-12 root', () => {
      const rootSchema: RJSFSchema = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $id: 'https://example.com/root.json',
        $defs: {
          A: { type: 'object', properties: { k: { const: 'a' }, x: { type: 'string', default: 'X' } } },
          B: { type: 'object', properties: { k: { const: 'b' }, y: { type: 'string', default: 'Y' } } },
          isB: { properties: { k: { const: 'b' } }, required: ['k'] },
        },
        type: 'object',
        properties: { k: { type: 'string' }, v: { oneOf: [{ $ref: '#/$defs/A' }, { $ref: '#/$defs/B' }] } },
        if: { $ref: '#/$defs/isB' },
        then: { properties: { t: { type: 'string', default: 'THEN' } } },
        else: { properties: { e: { type: 'string', default: 'ELSE' } } },
      };
      const schemaUtils = createSchemaUtils({ validator: buildValidator() }, rootSchema);
      const root = schemaUtils.getRootSchema();
      const options = optionsOf(root.properties?.v, 'oneOf');
      expect(schemaUtils.getFirstMatchingOption({ k: 'b' }, options)).toBe(1);
      expect(schemaUtils.getClosestMatchingOption({ k: 'b' }, options)).toBe(1);
      expect(schemaUtils.getDefaultFormState(root, { k: 'b', v: { k: 'b' } })).toEqual({
        k: 'b',
        v: { k: 'b', y: 'Y' },
        t: 'THEN',
      });
    });
  });
}
