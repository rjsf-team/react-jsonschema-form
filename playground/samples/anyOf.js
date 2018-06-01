module.exports = {
  schema: {
    type: 'object',
    definitions: {
      option: {
        type: 'object',
        required: ['label', 'value'],
        properties: {
          label: {
            type: 'string',
          },
          value: {
            type: 'string',
          },
        },
        default: { label: '', value: '' }
      },
      optGroup: {
        type: 'object',
        required: ['label', 'items'],
        properties: {
          label: {
            type: 'string',
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/definitions/option',
            },
          },
        },
        default: {
          label: '',
          items: [],
        },
      },
    },
    properties: {
      options: {
        type: 'array',
        title: 'Options',
        items: {
          anyOf: [
            {
              $ref: '#/definitions/option',
              title: 'option',
            },
            {
              $ref: '#/definitions/optGroup',
              title: 'optGroup',
            },
          ],
        },
      },
    },
  },
  uiSchema: {},
  formData: {
    options: [
      { label: 'car', value: 'car' },
      { label: 'house', value: 'house' },
      {
        label: 'fruit',
        items: [
          { label: 'apple', value: 'apple' },
          { label: 'banana', value: 'banana' },
        ],
      },
    ]
  },
};
