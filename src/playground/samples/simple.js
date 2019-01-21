export default {
  schema: {
    title: "A registration form",
    description: "A simple form example.",
    type: "object",
    required: ["firstName", "lastName"],
    properties: {
      firstName: {
        type: "string",
        title: "First name",
        default: "Chuck",
        maxLength: 5,
        pattern: "[A-Za-z\s]"
      },
      lastName: {
        type: "string",
        title: "Last name",
      },
      age: {
        type: "integer",
        title: "Age",
      },
      bio: {
        type: "string",
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
      documentUpload: {
        type: "string",
        title: "Upload the Document",
      }
    },
    errorMessage: {
      properties: {
        password: "Password should be longer than 3 characters",
        firstName: {
          maxLength: "Firstname should not be longer than 5 characters",
          pattern: "Firstname should only contain alphabets and spaces"
        }
      }
    }
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
    },
    bio: {
      "ui:widget": "textarea",
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
      "ui:widget": "telephone",
      "ui:countryCode": "+65"
    },
    documentUpload: {
      "ui:widget": "document",
      "ui:doc_type": 10
    },
  },
  formData: {
    lastName: "Norris",
    age: 75,
    bio: "Roundhouse kicking asses since 1940",
    password: "noneed",
  },
};
