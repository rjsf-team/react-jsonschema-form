export default {
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
  formData: {
    lat: 0,
    lon: 0,
  },
};
