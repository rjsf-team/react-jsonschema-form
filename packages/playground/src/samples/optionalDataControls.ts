import { Sample } from './Sample';

const optionalDataControls: Sample = {
  schema: {
    title: 'test',
    properties: {
      nestedObjectOptional: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
          },
          deepObjectOptional: {
            type: 'object',
            properties: {
              deepTest: {
                type: 'string',
              },
            },
          },
          deepObject: {
            type: 'object',
            properties: {
              deepTest: {
                type: 'string',
              },
            },
          },
          deepArrayOptional: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          deepArrayOptional2: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          deepArray: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        required: ['deepObject', 'deepArray'],
      },
      nestedArrayOptional: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      nestedObject: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
          },
        },
      },
      nestedArray: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      optionalObjectWithOneofs: {
        oneOf: [
          {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'first_option',
                readOnly: true,
              },
            },
          },
          {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'second_option',
                readOnly: true,
              },
              flag: {
                type: 'boolean',
                default: false,
              },
            },
          },
          {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'third_option',
                readOnly: true,
              },
              flag: {
                type: 'boolean',
                default: false,
              },
              inner_obj: {
                type: 'object',
                properties: {
                  foo: {
                    type: 'string',
                  },
                },
              },
            },
          },
        ],
      },
    },
    required: ['nestedObject', 'nestedArray'],
  },
  uiSchema: {
    'ui:globalOptions': {
      enableOptionalDataFieldForType: ['object', 'array'],
    },
    nestedObjectOptional: {
      deepArrayOptional: {
        'ui:enableOptionalDataFieldForType': ['object'],
      },
    },
    optionalObjectWithOneofs: {
      'ui:enableOptionalDataFieldForType': [],
    },
  },
  experimental_defaultFormStateBehavior: {
    // Set the emptyObjectFields to only populate required defaults to highlight the code working
    emptyObjectFields: 'populateRequiredDefaults',
  },
};

export default optionalDataControls;
