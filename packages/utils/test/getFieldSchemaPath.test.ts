import { getFieldSchemaPath } from '../src/index.ts';

describe('getFieldSchemaPath()', () => {
  it.each([
    ['#/properties/a/allOf/0/type', '#/properties/a/type'],
    ['#/properties/a/anyOf/1/type', '#/properties/a/type'],
    ['#/properties/a/oneOf/2/type', '#/properties/a/type'],
    ['#/properties/a/then/required', '#/properties/a/required'],
    ['#/properties/a/else/required', '#/properties/a/required'],
    ['#/properties/a/dependentSchemas/b/required', '#/properties/a/required'],
    ['#/properties/a/dependencies/b/required', '#/properties/a/required'],
    ['#/properties/a/allOf/0/oneOf/1/type', '#/properties/a/type'],
    ['#/properties/a/allOf/0/$ref/$ref/type', '#/properties/a/type'],
    ['#/$defs/then/allOf/0/required', '#/$defs/then/required'],
    ['#/properties/properties/allOf/0/type', '#/properties/properties/type'],
  ])('removes the branches from %s', (schemaPath, fieldSchemaPath) => {
    expect(getFieldSchemaPath(schemaPath)).toEqual(fieldSchemaPath);
  });
  it.each([
    '#/properties/a/type',
    '#/properties/a/allOf',
    '#/properties/then/type',
    '#/patternProperties/else/type',
    '#/$defs/then/type',
    '#/definitions/allOf/0/type',
    '#/properties/a/allOf/0/properties/b/type',
  ])('keeps %s, which sits in no branch, as it is', (schemaPath) => {
    expect(getFieldSchemaPath(schemaPath)).toEqual(schemaPath);
  });
});
