import { RJSFValidationError } from '@rjsf/utils';

import { filterDuplicateErrors, transformRJSFValidationErrors } from '../src/processRawValidationErrors';

describe('filterDuplicateErrors', () => {
  // Fixture: one anyOf duplicate pair + one oneOf duplicate pair
  const anyOfDup1: RJSFValidationError = {
    name: 'required',
    property: '.field.foo',
    message: "must have required property 'foo'",
    schemaPath: '#/properties/field/anyOf/0/required',
    stack: "must have required property 'foo'",
  };
  const anyOfDup2: RJSFValidationError = {
    ...anyOfDup1,
    schemaPath: '#/properties/field/anyOf/1/required',
  };
  const oneOfDup1: RJSFValidationError = {
    name: 'required',
    property: '.field.bar',
    message: "must have required property 'bar'",
    schemaPath: '#/properties/field/oneOf/0/required',
    stack: "must have required property 'bar'",
  };
  const oneOfDup2: RJSFValidationError = {
    ...oneOfDup1,
    schemaPath: '#/properties/field/oneOf/1/required',
  };
  const errorList = [anyOfDup1, anyOfDup2, oneOfDup1, oneOfDup2];

  it('filters both anyOf and oneOf duplicates when no flag is provided (default "none")', () => {
    const result = filterDuplicateErrors(errorList);
    expect(result).toHaveLength(2);
    expect(result).toEqual([anyOfDup1, oneOfDup1]);
  });

  it('filters both anyOf and oneOf duplicates when flag is "none"', () => {
    const result = filterDuplicateErrors(errorList, 'none');
    expect(result).toHaveLength(2);
    expect(result).toEqual([anyOfDup1, oneOfDup1]);
  });

  it('returns errorList unmodified when flag is "all"', () => {
    const result = filterDuplicateErrors(errorList, 'all');
    expect(result).toHaveLength(4);
    expect(result).toBe(errorList);
  });

  it('suppresses anyOf filtering and still filters oneOf duplicates when flag is "anyOf"', () => {
    const result = filterDuplicateErrors(errorList, 'anyOf');
    expect(result).toHaveLength(3);
    expect(result).toEqual([anyOfDup1, anyOfDup2, oneOfDup1]);
  });

  it('suppresses oneOf filtering and still filters anyOf duplicates when flag is "oneOf"', () => {
    const result = filterDuplicateErrors(errorList, 'oneOf');
    expect(result).toHaveLength(3);
    expect(result).toEqual([anyOfDup1, oneOfDup1, oneOfDup2]);
  });
});

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
  it('should filter out duplicate anyOf messages', () => {
    const errors = [
      {
        instancePath: '/favouriteThings',
        schemaPath: '#/properties/favouriteThings/anyOf/0/required',
        keyword: 'required',
        params: {
          missingProperty: 'favouriteAnimal',
        },
        message: "must have required property 'favouriteAnimal'",
        schema: ['favouriteAnimal'],
        parentSchema: {
          type: 'object',
          properties: {
            favouriteAnimal: {
              type: 'string',
            },
            favouriteColour: {
              type: 'string',
            },
          },
          required: ['favouriteAnimal'],
        },
        data: {},
      },
      {
        instancePath: '/favouriteThings',
        schemaPath: '#/properties/favouriteThings/anyOf/1/required',
        keyword: 'required',
        params: {
          missingProperty: 'favouriteAnimal',
        },
        message: "must have required property 'favouriteAnimal'",
        schema: ['favouriteAnimal', 'favouriteColour'],
        parentSchema: {
          type: 'object',
          properties: {
            favouriteAnimal: {
              type: 'string',
            },
            favouriteColour: {
              type: 'string',
            },
            favouritePerson: {
              type: 'string',
            },
          },
          required: ['favouriteAnimal', 'favouriteColour'],
        },
        data: {},
      },
      {
        instancePath: '/favouriteThings',
        schemaPath: '#/properties/favouriteThings/anyOf/1/required',
        keyword: 'required',
        params: {
          missingProperty: 'favouriteColour',
        },
        message: "must have required property 'favouriteColour'",
        schema: ['favouriteAnimal', 'favouriteColour'],
        parentSchema: {
          type: 'object',
          properties: {
            favouriteAnimal: {
              type: 'string',
            },
            favouriteColour: {
              type: 'string',
            },
            favouritePerson: {
              type: 'string',
            },
          },
          required: ['favouriteAnimal', 'favouriteColour'],
        },
        data: {},
      },
      {
        instancePath: '/favouriteThings',
        schemaPath: '#/properties/favouriteThings/anyOf/2/required',
        keyword: 'required',
        params: {
          missingProperty: 'favouritePerson',
        },
        message: "must have required property 'favouritePerson'",
        schema: ['favouritePerson'],
        parentSchema: {
          type: 'object',
          properties: {
            favouritePerson: {
              type: 'string',
            },
          },
          required: ['favouritePerson'],
        },
        data: {},
      },
      {
        instancePath: '/favouriteThings',
        schemaPath: '#/properties/favouriteThings/anyOf',
        keyword: 'anyOf',
        params: {},
        message: 'must match a schema in anyOf',
        schema: [
          {
            type: 'object',
            properties: {
              favouriteAnimal: {
                type: 'string',
              },
              favouriteColour: {
                type: 'string',
              },
            },
            required: ['favouriteAnimal'],
          },
          {
            type: 'object',
            properties: {
              favouriteAnimal: {
                type: 'string',
              },
              favouriteColour: {
                type: 'string',
              },
              favouritePerson: {
                type: 'string',
              },
            },
            required: ['favouriteAnimal', 'favouriteColour'],
          },
          {
            type: 'object',
            properties: {
              favouritePerson: {
                type: 'string',
              },
            },
            required: ['favouritePerson'],
          },
        ],
        parentSchema: {
          anyOf: [
            {
              type: 'object',
              properties: {
                favouriteAnimal: {
                  type: 'string',
                },
                favouriteColour: {
                  type: 'string',
                },
              },
              required: ['favouriteAnimal'],
            },
            {
              type: 'object',
              properties: {
                favouriteAnimal: {
                  type: 'string',
                },
                favouriteColour: {
                  type: 'string',
                },
                favouritePerson: {
                  type: 'string',
                },
              },
              required: ['favouriteAnimal', 'favouriteColour'],
            },
            {
              type: 'object',
              properties: {
                favouritePerson: {
                  type: 'string',
                },
              },
              required: ['favouritePerson'],
            },
          ],
        },
        data: {},
      },
    ];
    const transformedErrors = transformRJSFValidationErrors(errors);

    expect(transformedErrors).not.toHaveLength(errors.length);
    expect(transformedErrors).toHaveLength(4);
  });
  it('should filter out duplicate oneOf messages', () => {
    const errors = [
      {
        instancePath: '/favouriteThings',
        schemaPath: '#/properties/favouriteThings/oneOf/0/required',
        keyword: 'required',
        params: {
          missingProperty: 'favouriteAnimal',
        },
        message: "must have required property 'favouriteAnimal'",
        schema: ['favouriteAnimal'],
        parentSchema: {
          type: 'object',
          properties: {
            favouriteAnimal: {
              type: 'string',
            },
            favouriteColour: {
              type: 'string',
            },
          },
          required: ['favouriteAnimal'],
        },
        data: {},
      },
      {
        instancePath: '/favouriteThings',
        schemaPath: '#/properties/favouriteThings/oneOf/1/required',
        keyword: 'required',
        params: {
          missingProperty: 'favouriteAnimal',
        },
        message: "must have required property 'favouriteAnimal'",
        schema: ['favouriteAnimal', 'favouriteColour'],
        parentSchema: {
          type: 'object',
          properties: {
            favouriteAnimal: {
              type: 'string',
            },
            favouriteColour: {
              type: 'string',
            },
            favouritePerson: {
              type: 'string',
            },
          },
          required: ['favouriteAnimal', 'favouriteColour'],
        },
        data: {},
      },
      {
        instancePath: '/favouriteThings',
        schemaPath: '#/properties/favouriteThings/oneOf/1/required',
        keyword: 'required',
        params: {
          missingProperty: 'favouriteColour',
        },
        message: "must have required property 'favouriteColour'",
        schema: ['favouriteAnimal', 'favouriteColour'],
        parentSchema: {
          type: 'object',
          properties: {
            favouriteAnimal: {
              type: 'string',
            },
            favouriteColour: {
              type: 'string',
            },
            favouritePerson: {
              type: 'string',
            },
          },
          required: ['favouriteAnimal', 'favouriteColour'],
        },
        data: {},
      },
      {
        instancePath: '/favouriteThings',
        schemaPath: '#/properties/favouriteThings/oneOf/2/required',
        keyword: 'required',
        params: {
          missingProperty: 'favouritePerson',
        },
        message: "must have required property 'favouritePerson'",
        schema: ['favouritePerson'],
        parentSchema: {
          type: 'object',
          properties: {
            favouritePerson: {
              type: 'string',
            },
          },
          required: ['favouritePerson'],
        },
        data: {},
      },
      {
        instancePath: '/favouriteThings',
        schemaPath: '#/properties/favouriteThings/oneOf',
        keyword: 'oneOf',
        params: {},
        message: 'must match a schema in oneOf',
        schema: [
          {
            type: 'object',
            properties: {
              favouriteAnimal: {
                type: 'string',
              },
              favouriteColour: {
                type: 'string',
              },
            },
            required: ['favouriteAnimal'],
          },
          {
            type: 'object',
            properties: {
              favouriteAnimal: {
                type: 'string',
              },
              favouriteColour: {
                type: 'string',
              },
              favouritePerson: {
                type: 'string',
              },
            },
            required: ['favouriteAnimal', 'favouriteColour'],
          },
          {
            type: 'object',
            properties: {
              favouritePerson: {
                type: 'string',
              },
            },
            required: ['favouritePerson'],
          },
        ],
        parentSchema: {
          oneOf: [
            {
              type: 'object',
              properties: {
                favouriteAnimal: {
                  type: 'string',
                },
                favouriteColour: {
                  type: 'string',
                },
              },
              required: ['favouriteAnimal'],
            },
            {
              type: 'object',
              properties: {
                favouriteAnimal: {
                  type: 'string',
                },
                favouriteColour: {
                  type: 'string',
                },
                favouritePerson: {
                  type: 'string',
                },
              },
              required: ['favouriteAnimal', 'favouriteColour'],
            },
            {
              type: 'object',
              properties: {
                favouritePerson: {
                  type: 'string',
                },
              },
              required: ['favouritePerson'],
            },
          ],
        },
        data: {},
      },
    ];
    const transformedErrors = transformRJSFValidationErrors(errors);

    expect(transformedErrors).not.toHaveLength(errors.length);
    expect(transformedErrors).toHaveLength(4);
  });
  describe('with suppressDuplicateFiltering', () => {
    // Two anyOf errors with the same message — normally one would be filtered as a duplicate
    const twoAnyOfDupErrors = [
      {
        instancePath: '/field',
        schemaPath: '#/properties/field/anyOf/0/required',
        keyword: 'required',
        params: { missingProperty: 'foo' },
        message: "must have required property 'foo'",
        parentSchema: {},
        data: {},
      },
      {
        instancePath: '/field',
        schemaPath: '#/properties/field/anyOf/1/required',
        keyword: 'required',
        params: { missingProperty: 'foo' },
        message: "must have required property 'foo'",
        parentSchema: {},
        data: {},
      },
    ];
    it('filters duplicates when flag is "none"', () => {
      expect(transformRJSFValidationErrors(twoAnyOfDupErrors, undefined, 'none')).toHaveLength(1);
    });
    it('returns all errors unfiltered when flag is "all"', () => {
      expect(transformRJSFValidationErrors(twoAnyOfDupErrors, undefined, 'all')).toHaveLength(2);
    });
    it('skips anyOf duplicate filtering when flag is "anyOf"', () => {
      expect(transformRJSFValidationErrors(twoAnyOfDupErrors, undefined, 'anyOf')).toHaveLength(2);
    });
    it('still filters anyOf duplicates when flag is "oneOf"', () => {
      expect(transformRJSFValidationErrors(twoAnyOfDupErrors, undefined, 'oneOf')).toHaveLength(1);
    });
  });
});
