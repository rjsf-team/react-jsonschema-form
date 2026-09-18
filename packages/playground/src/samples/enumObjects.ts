import type { Sample } from './Sample.ts';

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
      rating: {
        title: 'Rating (map-based enumNames)',
        type: 'number',
        enum: [1, 2, 3, 4, 5],
      },
      priority: {
        title: 'Priority (enumOrder)',
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
      },
      category: {
        title: 'Category (optgroups)',
        type: 'string',
        enum: ['apple', 'banana', 'carrot', 'potato', 'salmon', 'chicken'],
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
      items: {
        ...ENUM_NAMES,
      },
    },
    checkboxes: {
      'ui:widget': 'CheckboxesWidget',
      items: {
        ...ENUM_NAMES,
      },
    },
    rating: {
      'ui:enumNames': {
        1: 'Terrible',
        2: 'Poor',
        3: 'Average',
        4: 'Good',
        5: 'Excellent',
      },
    },
    priority: {
      'ui:enumNames': {
        low: 'Low priority',
        medium: 'Medium priority',
        high: 'High priority',
        critical: 'Critical priority',
      },
      'ui:enumOrder': ['critical', 'high', '*'],
    },
    category: {
      'ui:options': {
        optgroups: {
          Fruits: ['apple', 'banana'],
          Vegetables: ['carrot', 'potato'],
          Meat: ['salmon', 'chicken'],
        },
      },
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
