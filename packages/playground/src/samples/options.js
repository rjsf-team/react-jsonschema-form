export default {
  schema: {
    title: 'A registration form',
    description: 'A simple form example. Demonstrating ui options',
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
      telephone: {
        type: 'string',
        title: 'Telephone',
        minLength: 10,
      },
    },
  },
  uiSchema: {
    'ui:submitButtonOptions': {
      submitText: 'Confirm Details',
      norender: false,
      props: {
        disabled: false,
        className: 'btn btn-info',
      },
    },
    firstName: {
      'ui:autofocus': true,
      'ui:emptyValue': '',
      'ui:autocomplete': 'family-name',
    },
    lastName: {
      'ui:title': 'Surname',
      'ui:emptyValue': '',
      'ui:autocomplete': 'given-name',
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
};
