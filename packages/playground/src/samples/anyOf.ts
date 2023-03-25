export default {
  schema: {
    type: 'object',
    properties: {
      age: {
        type: 'integer',
        title: 'Age',
      },
      items: {
        type: 'array',
        items: {
          type: 'object',
          anyOf: [
            {
              properties: {
                foo: {
                  type: 'string',
                },
              },
            },
            {
              properties: {
                bar: {
                  type: 'string',
                },
              },
            },
          ],
        },
      },
    },
    anyOf: [
      {
        title: 'First method of identification',
        properties: {
          firstName: {
            type: 'string',
            title: 'First name',
            default: 'Chuck',
          },
          lastName: {
            type: 'string',
            title: 'Last name',
          },
        },
      },
      {
        title: 'Second method of identification',
        properties: {
          idCode: {
            type: 'string',
            title: 'ID code',
          },
        },
      },
    ],
  },
  formData: {},
};
