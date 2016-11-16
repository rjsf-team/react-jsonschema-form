function validate({pass1, pass2}, errors) {

  return new Promise((resolve/*, reject*/) => {

    setTimeout(() => {
      if (pass1 !== pass2) {
        errors.pass2.addError("Deferred check: passwords not matched");
      }
      resolve(errors);
    }, 42);

  });

}

module.exports = {
  schema: {
    title: "Custom async validation",
    description: "This form defines custom async validation rules checking that the two passwords match.",
    type: "object",
    properties: {
      pass1: {
        title: "Password",
        type: "string",
        minLength: 3
      },
      pass2: {
        title: "Repeat password",
        type: "string",
        minLength: 3
      },
    }
  },
  uiSchema: {
    pass1: {"ui:widget": "password"},
    pass2: {"ui:widget": "password"},
  },
  formData: {},
  validate
};
