import type { Sample } from './Sample.ts';

const custom: Sample = {
  schema: {
    title: 'A localisation form',
    type: 'object',
    required: ['lat', 'lon'],
    properties: {
      lat: {
        type: 'number',
      },
      lon: {
        type: 'number',
      },
    },
  },
  uiSchema: {
    'ui:field': 'geo',
  },
  initialFormData: {
    lat: 0,
    lon: 0,
  },
};

export default custom;
