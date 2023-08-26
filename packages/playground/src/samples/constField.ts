export default {
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        const: 'John',
      },
      address: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
          },
          detail: {
            type: 'object',
            properties: {
              street: {
                type: 'string',
              },
              zip: {
                type: 'integer',
              },
            },
          },
        },
        const: {
          city: 'New York',
          detail: {
            street: 'First Street',
            zip: 12345,
          },
        },
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
        },
        const: ['red', 'green', 'blue'],
      },
      isVerified: {
        type: 'boolean',
        const: true,
      },
      age: {
        type: 'number',
        const: 30,
      },
    },
  },
  formData: {},
};
