export default {
  schema: {
    title: 'A registration form',
    description: 'A simple form example.',
    type: 'object',
    required: ['firstName', 'lastName'],
    properties: {
      firstName: {
        type: 'string',
        title: 'First name',
        default: 'Chuck',
      },
      lastName: {
        type: 'string',
        title: 'Last name',
      },
      age: {
        type: 'integer',
        title: 'Age',
      },
      bio: {
        type: 'string',
        title: 'Bio',
      },
      password: {
        type: 'string',
        title: 'Password',
        minLength: 3,
      },
      telephone: {
        type: 'string',
        title: 'Telephone',
        minLength: 10,
      },
    },
  },
  uiSchema: {
    firstName: {
      'ui:autofocus': true,
      'ui:emptyValue': '',
    },
    age: {
      'ui:widget': 'updown',
      'ui:title': 'Age of person',
      'ui:description': '(earthian year)',
    },
    bio: {
      'ui:widget': 'textarea',
    },
    password: {
      'ui:widget': 'password',
      'ui:help': 'Hint: Make it strong!',
    },
    date: {
      'ui:widget': 'alt-datetime',
    },
    telephone: {
      'ui:options': {
        inputType: 'tel',
      },
    },
  },
  formData: {
    lastName: 'Norris',
    age: 75,
    bio: 'Roundhouse kicking asses since 1940',
    password: 'noneed',
  },
  extraErrors: {
    firstName: {
      __errors: ['some error that got added as a prop'],
    },
  },
};
