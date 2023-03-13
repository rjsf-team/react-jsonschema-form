export default {
  schema: {
    type: 'object',
    title: 'Number fields & widgets',
    properties: {
      number: {
        title: 'Number',
        type: 'number',
      },
      integer: {
        title: 'Integer',
        type: 'integer',
      },
      numberEnum: {
        type: 'number',
        title: 'Number enum',
        enum: [1, 2, 3],
      },
      numberEnumRadio: {
        type: 'number',
        title: 'Number enum',
        enum: [1, 2, 3],
      },
      integerRange: {
        title: 'Integer range',
        type: 'integer',
        minimum: -50,
        maximum: 50,
      },
      integerRangeSteps: {
        title: 'Integer range (by 10)',
        type: 'integer',
        minimum: 50,
        maximum: 100,
        multipleOf: 10,
      },
    },
  },
  uiSchema: {
    integer: {
      'ui:widget': 'updown',
    },
    numberEnumRadio: {
      'ui:widget': 'radio',
      'ui:options': {
        inline: true,
      },
    },
    integerRange: {
      'ui:widget': 'range',
    },
    integerRangeSteps: {
      'ui:widget': 'range',
    },
  },
  formData: {
    number: 3.14,
    integer: 42,
    numberEnum: 2,
    integerRange: 42,
    integerRangeSteps: 80,
  },
};
