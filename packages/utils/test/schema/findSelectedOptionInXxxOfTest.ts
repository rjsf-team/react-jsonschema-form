import { ANY_OF_KEY, createSchemaUtils, ONE_OF_KEY, RJSFSchema } from '../../src';
import { TestValidatorType } from './types';
import {
  ANSWER_1,
  ANSWER_2,
  CHOICES,
  testAnyOfDiscriminatorSchema,
  testAnyOfSchema,
  testOneOfDiscriminatorSchema,
  testOneOfSchema,
} from '../testUtils/testData';

export default function findSelectedOptionInXxxOfTest(testValidator: TestValidatorType) {
  const schemaUtils = createSchemaUtils(testValidator, {} as RJSFSchema);
  describe('findSelectedOptionInXxxOf', () => {
    test('returns undefined when schema has no oneOfs', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf({}, 'foo', ONE_OF_KEY)).toBeUndefined();
    });
    test('returns undefined when schema has no anyOfs', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf({}, 'foo', ANY_OF_KEY)).toBeUndefined();
    });
    test('returns undefined when formData has no oneOf value via the fallbackField', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf(testOneOfSchema, 'name', ONE_OF_KEY)).toBeUndefined();
    });
    test('returns undefined when formData has no anyOf value via the fallbackField', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf(testAnyOfSchema, 'name', ANY_OF_KEY)).toBeUndefined();
    });
    test('returns undefined when formData has no oneOf value via the discriminator', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf(testOneOfDiscriminatorSchema, 'name', ONE_OF_KEY)).toBeUndefined();
    });
    test('returns undefined when formData has no oneOf value via the discriminator', () => {
      expect(schemaUtils.findSelectedOptionInXxxOf(testAnyOfDiscriminatorSchema, 'name', ANY_OF_KEY)).toBeUndefined();
    });
    test('returns oneOf when formData has value via the fallbackField', () => {
      const expectedResult = CHOICES[0];
      expect(schemaUtils.findSelectedOptionInXxxOf(testOneOfSchema, 'answer', ONE_OF_KEY, ANSWER_1)).toEqual(
        expectedResult,
      );
    });
    test('returns anyOf when formData has value via the fallbackField', () => {
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
    test('returns undefined when formData has non-existent anyOf value via the discriminator', () => {
      expect(
        schemaUtils.findSelectedOptionInXxxOf(testAnyOfDiscriminatorSchema, 'ignored_in_this_test', ANY_OF_KEY, {}),
      ).toBeUndefined();
    });
  });
}
