import { ANY_OF_KEY, createSchemaUtils, ONE_OF_KEY } from '../../src/index.ts';
import type { RJSFSchema } from '../../src/index.ts';
import {
  ANSWER_1,
  ANSWER_2,
  CHOICES,
  testAnyOfDiscriminatorSchema,
  testAnyOfSchema,
  testOneOfDiscriminatorSchema,
  testOneOfSchema,
} from '../testUtils/testData.ts';
import type { TestValidatorType } from './types.ts';

export default function findSelectedOptionInXxxOfTest(testValidator: TestValidatorType) {
  const schemaUtils = createSchemaUtils({ validator: testValidator }, {});
  describe('findSelectedOptionInXxxOf', () => {
    test('returns undefined when schema has no oneOfs', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf({}, 'foo', ONE_OF_KEY)).toBeUndefined();
    });
    test('returns undefined when schema has no anyOfs', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf({}, 'foo', ANY_OF_KEY)).toBeUndefined();
    });
    test('returns the first oneOf with no discriminator and no data, the one a field renders', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf(testOneOfSchema, 'answer', ONE_OF_KEY)).toEqual(CHOICES[0]);
    });
    test('returns the first anyOf with no discriminator and no data, the one a field renders', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf(testAnyOfSchema, 'answer', ANY_OF_KEY)).toEqual(CHOICES[0]);
    });
    test('returns undefined when formData has no oneOf value via the discriminator', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf(testOneOfDiscriminatorSchema, 'name', ONE_OF_KEY)).toBeUndefined();
    });
    test('returns undefined when formData has no oneOf value via the discriminator', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf(testAnyOfDiscriminatorSchema, 'name', ANY_OF_KEY)).toBeUndefined();
    });
    test('returns the closest oneOf with no discriminator', () => {
      const expectedResult = CHOICES[0];
      expect(schemaUtils.findSelectedOptionInXxxOf(testOneOfSchema, 'answer', ONE_OF_KEY, ANSWER_1)).toEqual(
        expectedResult,
      );
    });
    test('returns the closest anyOf with no discriminator', () => {
      const expectedResult = CHOICES[0];
      expect(schemaUtils.findSelectedOptionInXxxOf(testAnyOfSchema, 'answer', ANY_OF_KEY, ANSWER_1)).toEqual(
        expectedResult,
      );
    });
    test('returns oneOf when formData has value via the discriminator', () => {
      expect(
        schemaUtils.findSelectedOptionInXxxOf(
          testOneOfDiscriminatorSchema,
          'ignored_in_this_test',
          ONE_OF_KEY,
          ANSWER_2,
        ),
      ).toEqual(CHOICES[1]);
    });
    test('returns anyOf when formData has value via the discriminator', () => {
      expect(
        schemaUtils.findSelectedOptionInXxxOf(
          testAnyOfDiscriminatorSchema,
          'ignored_in_this_test',
          ANY_OF_KEY,
          ANSWER_2,
        ),
      ).toEqual(CHOICES[1]);
    });
    test('returns undefined when formData has non-existent oneOf value via the discriminator', () => {
      expect(
        schemaUtils.findSelectedOptionInXxxOf(testOneOfDiscriminatorSchema, 'ignored_in_this_test', ONE_OF_KEY, {}),
      ).toBeUndefined();
    });
    test('returns the option whose selector property, written as a $ref, holds the value', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          catKind: { type: 'string', const: 'cat' },
          dogKind: { type: 'string', const: 'dog' },
        },
        discriminator: { propertyName: 'kind' },
        oneOf: [
          { type: 'object', properties: { kind: { $ref: '#/definitions/catKind' }, meow: { type: 'string' } } },
          { type: 'object', properties: { kind: { $ref: '#/definitions/dogKind' }, bark: { type: 'string' } } },
        ],
      };
      const utils = createSchemaUtils({ validator: testValidator }, rootSchema);
      const selected = utils.findSelectedOptionInXxxOf(rootSchema, 'kind', ONE_OF_KEY, { kind: 'dog' });
      expect(Object.keys(selected?.properties ?? {})).toEqual(['kind', 'bark']);
    });
    test('passes over an option that does not declare the discriminator', () => {
      const undeclared: RJSFSchema = { type: 'object', properties: { other: { type: 'string' } } };
      const declared: RJSFSchema = { type: 'object', properties: { kind: { const: 'x' } } };
      const schema: RJSFSchema = {
        type: 'object',
        discriminator: { propertyName: 'kind' },
        oneOf: [undeclared, declared],
      };
      expect(schemaUtils.findSelectedOptionInXxxOf(schema, 'kind', ONE_OF_KEY, { kind: 'x' })).toEqual(declared);
    });
    describe('options with no selector', () => {
      const first: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
      const second: RJSFSchema = { type: 'object', properties: { b: { type: 'number' } } };
      const schema: RJSFSchema = { type: 'object', anyOf: [first, second] };

      afterEach(() => {
        testValidator.reset?.();
      });

      test('returns the option the data matches closest', () => {
        testValidator.setReturnValues({ isValid: [false, true] });
        expect(schemaUtils.findSelectedOptionInXxxOf(schema, 'b', ANY_OF_KEY, { b: 1 })).toEqual(second);
      });
      test('returns the first option with no data, the one a field renders', () => {
        testValidator.setReturnValues({ isValid: [false, false] });
        expect(schemaUtils.findSelectedOptionInXxxOf(schema, 'a', ANY_OF_KEY)).toEqual(first);
      });
      test('returns the first option with no data, even where a later one matches an empty object', () => {
        const laterMatchesEmpty: RJSFSchema = { type: 'object', anyOf: [first, { type: 'object', title: 'Empty' }] };
        testValidator.setReturnValues({ isValid: [false, true] });
        expect(schemaUtils.findSelectedOptionInXxxOf(laterMatchesEmpty, 'a', ANY_OF_KEY)).toEqual(first);
      });
      test('reads a value only some options hold as no selector, since it cannot tell them apart', () => {
        const someHold: RJSFSchema = {
          type: 'object',
          anyOf: [{ type: 'object', properties: { kind: { const: 'x' } } }, second],
        };
        testValidator.setReturnValues({ isValid: [false, true] });
        expect(schemaUtils.findSelectedOptionInXxxOf(someHold, 'kind', ANY_OF_KEY, { b: 1 })).toEqual(second);
      });
      test('returns the closest option over an earlier one holding the value of fallbackField', () => {
        const sharedDefault: RJSFSchema = {
          type: 'object',
          anyOf: [
            { type: 'object', properties: { kind: { const: 'a' }, shared: { default: 'x' } } },
            { type: 'object', properties: { kind: { const: 'b' }, shared: { default: 'x' } } },
          ],
        };
        testValidator.setReturnValues({ isValid: [false, true] });
        expect(
          schemaUtils.findSelectedOptionInXxxOf(sharedDefault, 'shared', ANY_OF_KEY, { kind: 'b', shared: 'x' }),
        ).toEqual(sharedDefault.anyOf?.[1]);
      });
      test('returns the option the data matches closest for a value no option holds', () => {
        const allHold: RJSFSchema = {
          type: 'object',
          anyOf: [
            { type: 'object', properties: { a: { default: 'x' } } },
            { type: 'object', properties: { a: { default: 'y' }, b: { type: 'number' } } },
          ],
        };
        testValidator.setReturnValues({ isValid: [false, true] });
        expect(schemaUtils.findSelectedOptionInXxxOf(allHold, 'a', ANY_OF_KEY, { a: 'typed', b: 1 })).toEqual(
          allHold.anyOf?.[1],
        );
      });
    });
    test('returns undefined when formData has non-existent anyOf value via the discriminator', () => {
      expect(
        schemaUtils.findSelectedOptionInXxxOf(testAnyOfDiscriminatorSchema, 'ignored_in_this_test', ANY_OF_KEY, {}),
      ).toBeUndefined();
    });
  });
}
