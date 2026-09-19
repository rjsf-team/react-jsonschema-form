import type { Sample } from './Sample.ts';

const anyOf: Sample = {
  schema: {
    type: 'object',
    properties: {
      age: {
        type: 'integer',
        title: 'Age',
      },
      priority: {
        title: 'Priority (constant options without a type)',
        anyOf: [
          { title: 'Low', const: 0 },
          { title: 'Normal', const: 1 },
          { title: 'High', const: 2 },
        ],
      },
      contact: {
        title: 'Contact (single value enum options without a type)',
        anyOf: [
          { title: 'Email', type: 'string', enum: ['email'] },
          { title: 'Phone', type: 'string', enum: ['phone'] },
        ],
      },
      subscribed: {
        title: 'Subscribed (a single boolean constant with a null option)',
        anyOf: [
          { title: 'Not answered', const: null },
          { title: 'Subscribed', const: true },
        ],
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

export default anyOf;
