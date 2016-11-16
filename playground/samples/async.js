function validate(formData) {

  return new Promise((resolve/*, reject*/) => {

    setTimeout(() => {
      const errors = [];
      const {pass1, pass2} = formData;
      if (pass1 !== pass2) {

        errors.push({property: "instance.pass2", message: "Deferred check: passwords not matched"});
      }
      resolve(errors);
    }, 500);

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
