import type { Sample } from './Sample.ts';

const propertyNames: Sample = {
  schema: {
    title: 'Feature flags',
    description:
      'An object whose keys are constrained by `propertyNames`. Because the allowed names are enumerated, each key is ' +
      'picked from a dropdown rather than typed, and a name another key already holds is left out of the list.',
    type: 'object',
    additionalProperties: {
      type: 'boolean',
    },
    propertyNames: {
      enum: ['darkMode', 'betaBanner', 'offlineCache', 'telemetry'],
    },
  },
  uiSchema: {},
  formData: {
    darkMode: true,
  },
};

export default propertyNames;
