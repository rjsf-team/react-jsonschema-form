import type { RJSFSchema, ValidatorType } from '../../src/index.ts';
import { createSchemaUtils, isSchemaObject } from '../../src/index.ts';
import { PET_RESOURCE_SCHEMA } from './testData.ts';

const DRAFT_2020_12 = 'https://json-schema.org/draft/2020-12/schema';

/** Returns the options of the field `key` of the root as `retrieveSchema()` hands them out: as written, their `$ref`s
 * left for the validator to resolve
 */
function optionsOf(validator: ValidatorType, rootSchema: RJSFSchema, key: string): RJSFSchema[] {
  const schemaUtils = createSchemaUtils({ validator }, rootSchema);
  const field = schemaUtils.retrieveSchema(rootSchema).properties?.[key];
  const options = isSchemaObject(field) ? schemaUtils.retrieveSchema(field).oneOf : undefined;
  return (options ?? []).filter((option) => isSchemaObject(option));
}

/** Runs the cases where the validator is handed a subschema that sits in a resource of its own inside the root, an
 * option below an `$id`, holding a `$ref` that resolves against that resource rather than the root. Each validator
 * package passes a validator for the root it is given, of the dialect the root names.
 *
 * @param validatorFor - Returns a validator for the root schema it is given
 */
export default function nestedResourceTests(validatorFor: (rootSchema: RJSFSchema) => ValidatorType) {
  describe('a $ref below an $id of its own in the root', () => {
    it("scores an option by a relative $ref its resource's $id resolves", () => {
      const option = (kind: string, extra: string): RJSFSchema => ({
        type: 'object',
        properties: { kind: { $ref: `kinds.json#/definitions/${kind}` }, [extra]: { type: 'string', default: extra } },
      });
      const rootSchema: RJSFSchema = {
        $id: 'https://example.com/root.json',
        type: 'object',
        properties: { pet: { $ref: 'sub/pets.json' } },
        definitions: {
          pets: { $id: 'sub/pets.json', oneOf: [option('cat', 'meow'), option('dog', 'bark')] },
          kinds: { $id: 'sub/kinds.json', definitions: { cat: { const: 'cat' }, dog: { const: 'dog' } } },
        },
      };
      const validator = validatorFor(rootSchema);
      const options = optionsOf(validator, rootSchema, 'pet');
      const schemaUtils = createSchemaUtils({ validator }, rootSchema);
      expect(options).toHaveLength(2);
      expect(schemaUtils.getClosestMatchingOption({ kind: 'dog' }, options)).toBe(1);
      expect(schemaUtils.getClosestMatchingOption({ kind: 'cat' }, options)).toBe(0);
      expect(schemaUtils.getDefaultFormState(rootSchema, { pet: { kind: 'dog' } })).toEqual({
        pet: { kind: 'dog', bark: 'bark' },
      });
    });
    it('scores an option with an $id of its own by a relative $ref that $id resolves', () => {
      const option = (kind: string): RJSFSchema => ({
        $id: `https://example.com/sub/${kind}.json`,
        type: 'object',
        properties: { kind: { $ref: `kinds.json#/definitions/${kind}` } },
      });
      const rootSchema: RJSFSchema = {
        $id: 'https://example.com/root.json',
        type: 'object',
        properties: { pet: { oneOf: [option('cat'), option('dog')] } },
        definitions: {
          kinds: {
            $id: 'https://example.com/sub/kinds.json',
            definitions: { cat: { const: 'cat' }, dog: { const: 'dog' } },
          },
        },
      };
      const validator = validatorFor(rootSchema);
      const options = optionsOf(validator, rootSchema, 'pet');
      const schemaUtils = createSchemaUtils({ validator }, rootSchema);
      expect(schemaUtils.getClosestMatchingOption({ kind: 'dog' }, options)).toBe(1);
      expect(schemaUtils.getClosestMatchingOption({ kind: 'cat' }, options)).toBe(0);
    });
    it("scores an option by a fragment $ref its resource's $id resolves, not the root's definition of that name", () => {
      const option = (kind: string): RJSFSchema => ({
        type: 'object',
        properties: { kind: { $ref: `#/$defs/${kind}` } },
      });
      const rootSchema: RJSFSchema = {
        $schema: DRAFT_2020_12,
        $id: 'https://example.com/root.json',
        type: 'object',
        properties: { p: { $ref: 'pet.json' } },
        // The root's own definitions of the same names hold each other's value
        $defs: {
          cat: { const: 'dog' },
          dog: { const: 'cat' },
          pet: {
            $id: 'pet.json',
            $defs: { cat: { const: 'cat' }, dog: { const: 'dog' } },
            oneOf: [option('cat'), option('dog')],
          },
        },
      };
      const validator = validatorFor(rootSchema);
      const options = optionsOf(validator, rootSchema, 'p');
      const schemaUtils = createSchemaUtils({ validator }, rootSchema);
      expect(schemaUtils.getClosestMatchingOption({ kind: 'dog' }, options)).toBe(1);
      expect(schemaUtils.getClosestMatchingOption({ kind: 'cat' }, options)).toBe(0);
    });
  });
}

/** Returns the options of the field `p` of the root as `retrieveSchema()` hands them out for `formData`, each retrieved
 * for it as `MultiSchemaField` retrieves the option it renders
 */
function viewsOf(validator: ValidatorType, rootSchema: RJSFSchema, formData: unknown): RJSFSchema[] {
  const schemaUtils = createSchemaUtils({ validator }, rootSchema);
  const field = schemaUtils.retrieveSchema(rootSchema, { p: formData }).properties?.p;
  const view = isSchemaObject(field) ? schemaUtils.retrieveSchema(field, formData) : {};
  const options = [...(view.oneOf ?? []), ...(view.anyOf ?? [])].filter(isSchemaObject);
  return options.map((option) => schemaUtils.retrieveSchema(option, formData));
}

/** Runs the cases where the validator is handed an option as `retrieveSchema()` hands it out, whose subschemas are
 * merged from declarations in a resource of its own, holding a `$ref` written there: a property declared both beside a
 * `$ref` and in the definition it names, and an option a merge of two lists rebuilds. Each validator package passes a
 * validator for the root it is given, of the dialect the root names. The answers are those of the same schemas written
 * without the resource.
 *
 * @param validatorFor - Returns a validator for the root schema it is given
 * @param [checksViews=true] - Whether the validator checks a view it is handed itself, which a precompiled one, compiled
 *        with the schemas the form hands it, does not
 */
export function mergedResourceViewTests(validatorFor: (rootSchema: RJSFSchema) => ValidatorType, checksViews = true) {
  describe('a $ref a merged subschema of an option holds, written in a resource of its own', () => {
    // The root's own `cat` is an object holding `b`, which a `$ref` resolved against the root would read
    const homonym: RJSFSchema = {
      ...PET_RESOURCE_SCHEMA,
      $defs: { ...PET_RESOURCE_SCHEMA.$defs, cat: { type: 'object', properties: { b: { type: 'string' } } } },
    };
    // The same schema written without the resource, its `cat` a definition of the root's
    const flat: RJSFSchema = {
      ...PET_RESOURCE_SCHEMA,
      $defs: {
        petCat: { type: 'object', properties: { a: { type: 'string' } } },
        pet: { type: 'object', properties: { kind: { $ref: '#/$defs/petCat' } } },
        dog: PET_RESOURCE_SCHEMA.$defs?.dog ?? {},
      },
      properties: {
        p: { oneOf: [{ $ref: '#/$defs/pet', properties: { kind: { title: 'Kind' } } }, { $ref: '#/$defs/dog' }] },
      },
    };
    it.each<[string, RJSFSchema]>([
      ['', PET_RESOURCE_SCHEMA],
      [', where the root defines a definition of the same name', homonym],
      [', as the same schema written without the resource does', flat],
    ])("checks a merged property's $ref against the resource's definition%s", (_, rootSchema) => {
      const validator = validatorFor(rootSchema);
      const schemaUtils = createSchemaUtils({ validator }, rootSchema);
      const check = (formData: { kind?: unknown }) => {
        const views = viewsOf(validator, rootSchema, formData);
        const first = schemaUtils.getFirstMatchingOption(formData, views);
        const kind = views[0]?.properties?.kind;
        return checksViews
          ? { kind: isSchemaObject(kind) && validator.isValid(kind, formData.kind, rootSchema), first }
          : { first };
      };
      const expected = (kind: boolean, first: number) => (checksViews ? { kind, first } : { first });
      expect(check({ kind: { a: 'x', b: 'y' } })).toEqual(expected(true, 0));
      expect(check({ kind: { a: 1 } })).toEqual(expected(false, 0));
      expect(check({ kind: 'woof' })).toEqual(expected(false, 1));
    });
    // A precompiled validator has no function for an option a merge of two lists rebuilds, which stands for no
    // subschema of the root, wherever the lists sit
    it.runIf(checksViews)(
      'checks the $ref of an option a merge of two lists in the resource rebuilt against that resource',
      () => {
        const option = (key: string, beside: RJSFSchema = { $ref: '#/$defs/s' }, required?: string): RJSFSchema => ({
          properties: { [key]: beside },
          ...(required === undefined ? {} : { required: [required] }),
        });
        // The root's own `s` is a number, where the resource's is a string
        const rootSchema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: {
            s: { type: 'number' },
            res: {
              $id: 'res.json',
              $defs: {
                s: { type: 'string' },
                o: {
                  type: 'object',
                  allOf: [
                    { anyOf: [option('a', undefined, 'a'), option('b', undefined, 'b')] },
                    { anyOf: [option('a', { title: 'A' }), option('c')] },
                  ],
                },
              },
            },
          },
          type: 'object',
          properties: { p: { $ref: 'res.json#/$defs/o' } },
        };
        const validator = validatorFor(rootSchema);
        const schemaUtils = createSchemaUtils({ validator }, rootSchema);
        const check = (formData: unknown) => {
          const views = viewsOf(validator, rootSchema, formData);
          return {
            validity: views.map((view) => validator.isValid(view, formData, rootSchema)),
            first: schemaUtils.getFirstMatchingOption(formData, views),
          };
        };
        expect(check({ a: 'z' })).toEqual({ validity: [true, true, false, false], first: 0 });
        expect(check({ b: 'z', c: 'y' })).toEqual({ validity: [false, false, true, true], first: 1 });
        expect(check({ a: 1 })).toEqual({ validity: [false, false, false, false], first: 2 });
      },
    );
  });
}

/** Runs the cases where a caller hands the validator's `isValid()` a schema of its own, beside the root, that holds a
 * relative `$ref` below an `$id` naming a resource the root embeds: the option as the root holds it, a wrapper the
 * caller writes around a copy of it, and that wrapper as `retrieveSchema()` merges it. Each `$ref` resolves against the
 * `$id` above it, as JSON Schema reads it. `@rjsf/validator-cfworker` rejects a schema holding an `$id` the root it
 * registers beside it embeds as a duplicate, so only the validators that accept one run these.
 *
 * @param validatorFor - Returns a validator for the root schema it is given
 */
export function handedResourceTests(validatorFor: (rootSchema: RJSFSchema) => ValidatorType) {
  describe('a relative $ref below an $id of a schema handed to isValid()', () => {
    const resource: RJSFSchema = { $id: 'https://ex.com/schemas/a.json', properties: { s: { $ref: 'b.json' } } };
    const option: RJSFSchema = { ...resource, type: 'object', required: ['s'] };
    const rootSchema: RJSFSchema = {
      $id: 'https://ex.com/root.json',
      $defs: { b: { $id: 'https://ex.com/schemas/b.json', type: 'string', minLength: 3 } },
      properties: { q: { oneOf: [{ type: 'number' }, option] } },
    };
    const wrapper: RJSFSchema = { allOf: [resource, { required: ['s'] }] };
    it.each<[string, (validator: ValidatorType) => RJSFSchema]>([
      ['the option as the root holds it', () => option],
      ['a wrapper around a copy of it', () => wrapper],
      [
        'that wrapper as retrieveSchema() merges it',
        (validator) => createSchemaUtils({ validator }, rootSchema).retrieveSchema(wrapper),
      ],
    ])('resolves it against that $id in %s', (_name, schemaFor) => {
      const validator = validatorFor(rootSchema);
      const schema = schemaFor(validator);
      expect(validator.isValid(schema, { s: 'abcd' }, rootSchema)).toBe(true);
      expect(validator.isValid(schema, { s: 'ab' }, rootSchema)).toBe(false);
    });
  });
}
