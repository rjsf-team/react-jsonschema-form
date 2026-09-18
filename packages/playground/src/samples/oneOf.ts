import type { Sample } from './Sample.ts';

const oneOf: Sample = {
  schema: {
    type: 'object',
    properties: {
      size: {
        title: 'Size (constant options without a type)',
        oneOf: [
          { title: 'Small', const: 'small' },
          { title: 'Medium', const: 'medium' },
          { title: 'Large', const: 'large' },
        ],
      },
      region: {
        title: 'Region (nested oneOf of constants)',
        oneOf: [{ title: 'None', type: 'null' }, { $ref: '#/$defs/europe' }, { $ref: '#/$defs/northAmerica' }],
      },
      retries: {
        title: 'Retries (constants of mixed types)',
        oneOf: [
          { title: 'Never', const: false },
          { title: 'Once', const: 1 },
          { title: 'Unlimited', const: 'unlimited' },
        ],
      },
    },
    $defs: {
      europe: {
        title: 'Europe',
        oneOf: [
          { title: 'France', const: 'FR' },
          { title: 'Germany', const: 'DE' },
        ],
      },
      northAmerica: {
        title: 'North America',
        oneOf: [
          { title: 'Canada', const: 'CA' },
          { title: 'United States', const: 'US' },
        ],
      },
    },
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

export default oneOf;
