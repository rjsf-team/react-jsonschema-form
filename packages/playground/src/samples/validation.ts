import { Sample } from './Sample';
import { ErrorTransformer } from '@rjsf/utils';

function customValidate({ pass1, pass2 }: { pass1: string; pass2: string }, errors: any) {
  if (pass1 !== pass2) {
    errors.pass2.addError("Passwords don't match.");
  }
  return errors;
}

const transformErrors: ErrorTransformer = (errors) => {
  return errors.map((error) => {
    if (error.name === 'minimum' && error.schemaPath === '#/properties/age/minimum') {
      return Object.assign({}, error, {
        message: 'You need to be 18 because of some legal thing',
      });
    }
    return error;
  });
};

const validation: Sample = {
  schema: {
    title: 'Custom validation',
    description:
      'This form defines custom validation rules checking that the two passwords match. There is also a custom validation message when submitting an age < 18, which can only be seen if HTML5 validation is turned off.',
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
  customValidate,
  transformErrors,
};

export default validation;
