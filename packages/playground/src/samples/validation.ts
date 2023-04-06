function validate({ pass1, pass2 }: { pass1: string; pass2: string }, errors: any) {
  if (pass1 !== pass2) {
    errors.pass2.addError("Passwords don't match.");
  }
  return errors;
}

function transformErrors(errors: { name: string; property: string }[]) {
  return errors.map((error) => {
    if (error.name === 'minimum' && error.property === 'instance.age') {
      return Object.assign({}, error, {
        message: 'You need to be 18 because of some legal thing',
      });
    }
    return error;
  });
}

export default {
  schema: {
    title: 'Custom validation',
    description: 'This form defines custom validation rules checking that the two passwords match.',
    type: 'object',
    properties: {
      pass1: {
        title: 'Password',
        type: 'string',
        minLength: 3,
      },
      pass2: {
        title: 'Repeat password',
        type: 'string',
        minLength: 3,
      },
      age: {
        title: 'Age',
        type: 'number',
        minimum: 18,
      },
    },
  },
  uiSchema: {
    pass1: { 'ui:widget': 'password' },
    pass2: { 'ui:widget': 'password' },
  },
  formData: {},
  validate,
  transformErrors,
};
