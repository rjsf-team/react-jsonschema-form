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
});
