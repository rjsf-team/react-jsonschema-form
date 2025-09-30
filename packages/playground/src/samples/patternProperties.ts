import { Sample } from './Sample';

const patternProperties: Sample = {
  schema: {
    title: 'A customizable registration form',
    description: 'A simple form with pattern properties example.',
    type: 'object',
    required: ['firstName', 'lastName'],
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
    patternProperties: {
      '^[a-z][a-zA-Z]+$': {
        type: 'string',
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

export default patternProperties;
