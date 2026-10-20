import type { RJSFSchema, ValidatorType } from '../../src/index.ts';
import { createSchemaUtils, isSchemaObject } from '../../src/index.ts';

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
