import type { RJSFSchema } from '../src/index.ts';
import { createSchemaUtils, hasOwnContentBesideOptions } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

describe('hasOwnContentBesideOptions()', () => {
  const schemaUtils = createSchemaUtils({ validator: getTestValidator({}) }, {});
  test('an object with properties of its own has content beside its options', () => {
    const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: false };
    expect(hasOwnContentBesideOptions(schemaUtils, schema)).toBe(true);
  });
  test('an object with no properties of its own but room for more keys has content beside its options', () => {
    expect(hasOwnContentBesideOptions(schemaUtils, { type: 'object', additionalProperties: true })).toBe(true);
  });
  test('an object with neither is a pure union', () => {
    expect(hasOwnContentBesideOptions(schemaUtils, { type: 'object', additionalProperties: false })).toBe(false);
  });
  test('an expandable of false in the uiSchema rules out room for more keys', () => {
    const schema: RJSFSchema = { type: 'object', additionalProperties: true };
    expect(hasOwnContentBesideOptions(schemaUtils, schema, { 'ui:options': { expandable: false } })).toBe(false);
  });
});
