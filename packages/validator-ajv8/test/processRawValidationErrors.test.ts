import { transformRJSFValidationErrors } from '../src/processRawValidationErrors';

describe('transformRJSFValidationErrors', () => {
  // The rest of this function is tested by the validators
  it('should transform errors without an error message or parentSchema field', () => {
    const error = {
      instancePath: '/numberOfChildren',
      schemaPath: '#/properties/numberOfChildren/pattern',
      keyword: 'pattern',
      params: { pattern: '\\d+' },
      schema: '\\d+',
      data: 'aa',
    };

    const errors = transformRJSFValidationErrors([error]);

    expect(errors).toHaveLength(1);
  });
});
