export default {
  schema: {
    type: 'object',
    allOf: [
      {
        properties: {
          lorem: {
            type: ['string', 'boolean'],
            default: true,
          },
        },
      },
      {
        properties: {
          lorem: {
            type: 'boolean',
          },
          ipsum: {
            type: 'string',
          },
        },
      },
    ],
  },
  formData: {},
};
