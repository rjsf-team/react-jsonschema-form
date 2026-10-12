import { ADDITIONAL_PROPERTY_FLAG } from '../../src/constants.ts';
import type { RJSFSchema, ValidatorType } from '../../src/index.ts';
import { getFirstMatchingOption, JUNK_OPTION_ID } from '../../src/index.ts';
import { scoringSchemaWithDataKeys } from '../../src/schema/getFirstMatchingOption.ts';

/** A validator that records the schemas it is asked about and answers true for every one */
function recordingValidator() {
  const schemas: RJSFSchema[] = [];
  const validator = {
    isValid: (schema: RJSFSchema) => {
      schemas.push(schema);
      return true;
    },
  } as unknown as ValidatorType;
  return { schemas, validator };
}

const stub = (schema: RJSFSchema): RJSFSchema => ({ ...schema, [ADDITIONAL_PROPERTY_FLAG]: true });

describe('scoringSchemaWithDataKeys()', () => {
  it('drops the `required` scoring drops and adds no `anyOf` of the names', () => {
    expect(
      scoringSchemaWithDataKeys({
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: { type: 'number' },
      }),
    ).toEqual({ type: 'object', properties: { id: { type: 'string' } }, additionalProperties: { type: 'number' } });
  });
  it('derives the `$id` of an option that has one', () => {
    const scored = scoringSchemaWithDataKeys({
      $id: 'opt',
      type: 'object',
      properties: {},
      additionalProperties: true,
    });
    expect(scored.$id).toMatch(/^opt\?rjsf=/);
  });
  it('leaves the junk option as it is', () => {
    const junk: RJSFSchema = { $id: JUNK_OPTION_ID, type: 'object', properties: {}, required: ['x'] };
    expect(scoringSchemaWithDataKeys(junk)).toBe(junk);
  });
});

describe('scoring an option with keys of the data stubbed into it', () => {
  const declared: RJSFSchema = {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
    patternProperties: { '^s_': { type: 'string' } },
  };

  it('scores it without the stubs, in the form that does not depend on the keys', () => {
    const { schemas, validator } = recordingValidator();
    const retrieved: RJSFSchema = {
      ...declared,
      properties: { ...declared.properties, s_a: stub({ type: 'string' }) },
    };
    getFirstMatchingOption({ validator }, { id: 'x', s_a: 'y' }, [retrieved, { type: 'number' }], {});
    expect(schemas[0]).toEqual(scoringSchemaWithDataKeys(declared));
  });
  it('scores the same option with no stubs by the anyOf of its names, as before', () => {
    const { schemas, validator } = recordingValidator();
    getFirstMatchingOption({ validator }, { id: 'x' }, [declared, { type: 'number' }], {});
    expect(schemas[0]).toEqual({
      type: 'object',
      properties: declared.properties,
      patternProperties: declared.patternProperties,
      anyOf: [{ required: ['id'] }],
    });
  });
});
