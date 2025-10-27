import { Sample } from './Sample';

const fallback: Sample = {
  schema: {
    title: 'Fallback',
    description: 'A field with no JSON Schema "type".',
  },
  formData: 1234,
  useFallbackUiForUnsupportedType: true,
};

export default fallback;
