module.exports = {
  schema: {
    title: "A registration form (nullable)",
    description: "A simple form example using nullable types",
    type: "object",
    required: ["firstName", "lastName"],
    properties: {
      firstName: {
        type: "string",
        title: "First name",
        default: "Chuck",
      },
      lastName: {
        type: "string",
        title: "Last name",
      },
      age: {
        type: ["integer", "null"],
        title: "Age",
      },
      bio: {
        type: ["string", "null"],
        title: "Bio",
      },
      password: {
        type: "string",
        title: "Password",
        minLength: 3,
      },
      telephone: {
        type: "string",
        title: "Telephone",
        minLength: 10,
      },
    },
  },
  uiSchema: {
    firstName: {
      "ui:autofocus": true,
      "ui:emptyValue": "",
    },
    age: {
      "ui:widget": "updown",
      "ui:title": "Age of person",
      "ui:description": "(earthian year)",
      "ui:emptyValue": null,
    },
    bio: {
      "ui:widget": "textarea",
      "ui:placeholder":
        "Leaving this field empty will cause formData property to be `null`",
      "ui:emptyValue": null,
    },
    password: {
      "ui:widget": "password",
      "ui:help": "Hint: Make it strong!",
    },
    date: {
      "ui:widget": "alt-datetime",
    },
    telephone: {
      "ui:options": {
        inputType: "tel",
      },
    },
  },
  formData: {
    lastName: "Norris",
    age: 75,
    bio: null,
    password: "noneed",
  },
};
