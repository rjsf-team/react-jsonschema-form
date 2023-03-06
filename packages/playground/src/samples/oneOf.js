export default {
  schema: {
    type: 'object',
    oneOf: [
      {
        properties: {
          lorem: {
            type: 'string',
          },
        },
        required: ['lorem'],
      },
      {
        properties: {
          ipsum: {
            type: 'string',
          },
        },
        required: ['ipsum'],
      },
    ],
  },
  formData: {},
};
