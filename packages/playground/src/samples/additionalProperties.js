export default {
  schema: {
    title: 'A customizable registration form',
    description: 'A simple form with additional properties example.',
    type: 'object',
    required: ['firstName', 'lastName'],
    additionalProperties: {
      type: 'string',
    },
    properties: {
      firstName: {
        type: 'string',
        title: 'First name',
      },
      lastName: {
        type: 'string',
        title: 'Last name',
      },
    },
  },
  uiSchema: {
    firstName: {
      'ui:autofocus': true,
      'ui:emptyValue': '',
    },
  },
  formData: {
    firstName: 'Chuck',
    lastName: 'Norris',
    assKickCount: 'infinity',
  },
};
