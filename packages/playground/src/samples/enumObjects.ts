import { Sample } from './Sample';

const ENUM_NAMES = {
  'ui:enumNames': ['New York', 'Amsterdam', 'Hong Kong'],
};

const enumObjects: Sample = {
  schema: {
    definitions: {
      locations: {
        enum: [
          {
            name: 'New York',
            lat: 40,
            lon: 74,
          },
          {
            name: 'Amsterdam',
            lat: 52,
            lon: 5,
          },
          {
            name: 'Hong Kong',
            lat: 22,
            lon: 114,
          },
        ],
      },
    },
    type: 'object',
    properties: {
      location: {
        title: 'Location',
        $ref: '#/definitions/locations',
      },
      locationRadio: {
        title: 'Location Radio',
        $ref: '#/definitions/locations',
      },
      multiSelect: {
        title: 'Locations',
        type: 'array',
        uniqueItems: true,
        items: {
          $ref: '#/definitions/locations',
        },
      },
      checkboxes: {
        title: 'Locations Checkboxes',
        type: 'array',
        uniqueItems: true,
        items: {
          $ref: '#/definitions/locations',
        },
      },
    },
  },
  uiSchema: {
    location: ENUM_NAMES,
    locationRadio: {
      'ui:widget': 'RadioWidget',
      ...ENUM_NAMES,
    },
    multiSelect: {
      ...ENUM_NAMES,
    },
    checkboxes: {
      'ui:widget': 'CheckboxesWidget',
      ...ENUM_NAMES,
    },
  },
  formData: {
    location: {
      name: 'Amsterdam',
      lat: 52,
      lon: 5,
    },
  },
};

export default enumObjects;
