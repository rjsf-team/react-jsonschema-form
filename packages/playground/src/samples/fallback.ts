import type { Sample } from './Sample.ts';

const fallback: Sample = {
  schema: {
    title: 'Fallback',
    type: 'object',
    properties: {
      noType: {
        title: 'No type',
        description: 'A field with no JSON Schema "type".',
      },
      multipleTypes: {
        title: 'Multiple types',
        description: 'A field that allows any one of several types.',
        type: ['string', 'number', 'boolean'],
      },
      anything: {
        title: 'Anything',
        description: 'An object whose properties the schema puts no constraint on.',
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  formData: {
    noType: 1234,
    multipleTypes: 'a string',
    anything: { aKey: 'a value' },
  },
  useFallbackUiForUnsupportedType: true,
};

export default fallback;
