import { Sample } from './Sample';

const date: Sample = {
  schema: {
    title: 'Date and time widgets',
    type: 'object',
    properties: {
      native: {
        title: 'Native',
        description: 'May not work on some browsers, notably Firefox Desktop and IE.',
        type: 'object',
        properties: {
          datetime: {
            type: 'string',
            format: 'date-time',
          },
          date: {
            type: 'string',
            format: 'date',
          },
          time: {
            type: 'string',
            format: 'time',
          },
        },
      },
      alternative: {
        title: 'Alternative',
        description: 'These work on most platforms.',
        type: 'object',
        properties: {
          'alt-datetime': {
            type: 'string',
            format: 'date-time',
          },
          'alt-date': {
            type: 'string',
            format: 'date',
          },
        },
      },
    },
  },
  uiSchema: {
    alternative: {
      'alt-datetime': {
        'ui:widget': 'alt-datetime',
        'ui:options': {
          yearsRange: [1980, 2030],
          format: 'YMD',
        },
      },
      'alt-date': {
        'ui:widget': 'alt-date',
        'ui:options': {
          yearsRange: [1980, 2030],
          format: 'MDY',
        },
      },
    },
  },
  formData: {},
};

export default date;
