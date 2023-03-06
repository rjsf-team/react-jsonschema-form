export default {
  schema: {
    title: 'Schema default properties',
    type: 'object',
    properties: {
      valuesInFormData: {
        title: 'Values in form data',
        $ref: '#/definitions/defaultsExample',
      },
      noValuesInFormData: {
        title: 'No values in form data',
        $ref: '#/definitions/defaultsExample',
      },
    },
    definitions: {
      defaultsExample: {
        type: 'object',
        properties: {
          scalar: {
            title: 'Scalar',
            type: 'string',
            default: 'scalar default',
          },
          array: {
            title: 'Array',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nested: {
                  title: 'Nested array',
                  type: 'string',
                  default: 'nested array default',
                },
              },
            },
          },
          object: {
            title: 'Object',
            type: 'object',
            properties: {
              nested: {
                title: 'Nested object',
                type: 'string',
                default: 'nested object default',
              },
            },
          },
        },
      },
    },
  },
  uiSchema: {},
  formData: {
    valuesInFormData: {
      scalar: 'value',
      array: [
        {
          nested: 'nested array value',
        },
      ],
      object: {
        nested: 'nested object value',
      },
    },
    noValuesInFormData: {
      array: [{}, {}],
    },
  },
};
