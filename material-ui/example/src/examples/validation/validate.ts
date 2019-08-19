import { FormValidation } from 'react-jsonschema-form';

const validate = ({ pass1, pass2 }: any, errors: FormValidation) => {
  if (pass1 !== pass2) {
    errors.pass2.addError("Passwords don't match.");
  }

  return errors;
};

export default validate;
