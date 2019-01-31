export default {
  schema: {
    title: "Register with us!",
    description: "A simple registration form.",
    type: "object",
    required: ["name", "mobilePrimary", "email"],
    properties: {
      name: {
        type: "string",
        title: "FULL NAME",
        maxLength: 40,
        pattern: "[A-Za-z\s]"
      },
      mobilePrimary: {
        type: "string",
        title: "Primary Mobile Number",
      },
      mobileSecondary: {
        type: "string",
        title: "Secondary/Emergency Mobile Number",
      },
      email: {
        type: "string",
        title: "Email ID",
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
      join_reference: {
        title: "Join Reference",
        type: "string",
        enum: [
          "facebook",
          "self",
          "friends"
        ]
      },
      area: {
        type: "string",
        title: "Area",
      }
    }
  },

  uiSchema: {
    name: {
      "ui:autofocus": true,
      "ui:emptyValue": "",
      "ui:placeholder": "Your full name"
    },
    mobilePrimary: {
      "ui:options": {
        inputType: "tel",
      },
      "ui:widget": "telephone",
      "ui:countryCode": "+65"
    },
    mobileSecondary: {
      "ui:options": {
        inputType: "tel",
      },
      "ui:widget": "telephone",
      "ui:countryCode": "+65",
      "ui:placeholder": "Your emergency mobile number"
    },
    email: {
      "ui:widget": "email",
      "ui:placeholder": "Your email ID"
    },
    age: {
      "ui:widget": "updown",
      "ui:title": "Age",
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
    join_reference: {
      "ui:placeholder": "Please select join reference"
    },
    area: {
      "ui:widget": "dropdown",
      "ui:placeholder": "Please select area"
    }
  },

  formData: {
    "name": "Rajeev",
    "mobilePrimary": "81978820",
    "email": "callicoder@gmail.com"
  },
};
