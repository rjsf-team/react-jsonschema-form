function validate({pass1, pass2}) {
  if (pass1.getValue() !== pass2.getValue()) {
    pass2.addError("Passwords don't match.");
  }
}

module.exports = {
  schema:  {
    title: "Custom validation",
    description: "This form defines custom validation rules checking that the two passwords match.",
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
