export default {
  schema: {
    type: 'object',
    properties: {
      animal: {
        enum: ['Cat', 'Fish'],
      },
    },
    allOf: [
      {
        if: {
          properties: { animal: { const: 'Cat' } },
        },
        then: {
          properties: {
            food: { type: 'string', enum: ['meat', 'grass', 'fish'] },
          },
          required: ['food'],
        },
      },
      {
        if: {
          properties: { animal: { const: 'Fish' } },
        },
        then: {
          properties: {
            food: {
              type: 'string',
              enum: ['insect', 'worms'],
            },
            water: {
              type: 'string',
              enum: ['lake', 'sea'],
            },
          },
          required: ['food', 'water'],
        },
      },
      {
        required: ['animal'],
      },
    ],
  },
  formData: {},
};
