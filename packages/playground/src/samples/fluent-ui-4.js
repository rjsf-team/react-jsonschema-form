module.exports = {
  schema: {
    title: "Fluent UI demo 4",
    type: "object",
    required: ["title"],
    properties: {
      integerRange: {
        title: "Integer range",
        type: "integer",
        minimum: 42,
        maximum: 100,
      },
      integerRangeSteps: {
        title: "Integer range (by 10)",
        type: "integer",
        minimum: 50,
        maximum: 100,
        multipleOf: 10,
      },
      string: {
        type: "object",
        title: "",
        properties: {
          color: {
            type: "string",
            title: "color picker",
            default: "#151ce6",
          },
        },
      },
      password: {
        type: "string",
        title: "Password",
      },
      email: {
        type: "string",
        format: "email",
      },
      uri: {
        type: "string",
        format: "uri",
      },
      files: {
        type: "object",
        title: "Files",
        properties: {
          file: {
            type: "string",
            format: "data-url",
            title: "Single file",
          },
          files: {
            type: "array",
            title: "Multiple files",
            items: {
              type: "string",
              format: "data-url",
            },
          },
          filesAccept: {
            type: "string",
            format: "data-url",
            title: "Single File with Accept attribute",
          },
        },
      },
    },
  },
  uiSchema: {
    integerRange: {
      "ui:widget": "range",
    },
    integerRangeSteps: {
      "ui:widget": "range",
    },
    string: {
      color: {
        "ui:widget": "color",
      },
    },
    filesAccept: {
      "ui:options": {
        accept: ".pdf",
      },
    },
    password: {
      "ui:widget": "password",
    },
    email: {
      type: "string",
      format: "email",
    },
    uri: {
      type: "string",
      format: "uri",
    },
  },
  formData: {
    email: "chuck@norris.net",
    uri: "http://chucknorris.com/",
    integerRange: 42,
    integerRangeSteps: 80,
    password: "noneed",
  },
};
