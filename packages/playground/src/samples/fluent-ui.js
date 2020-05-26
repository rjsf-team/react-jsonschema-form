module.exports = {
  schema: {
    title: "Fluent UI demo",
    type: "object",
    properties: {
      name: {
        type: "string",
      },
      url: {
        type: "string",
      },
    },
  },
  uiSchema: {
    url: {
      "ui:options": {
        props: {
          prefix: "https://",
          suffix: ".com",
        },
      },
    },
  },
  formData: {},
};
