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
      grid1: {
        type: "object",
        properties: {
          line1: {
            type: "string",
          },
          line2: {
            type: "string",
          },
          city: {
            type: "string",
          },
          state: {
            type: "string",
          },
          zip: {
            type: "string",
          },
        },
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
    grid1: {
      city: {
        classNames: "ms-Grid-col ms-sm4",
      },
      state: {
        classNames: "ms-Grid-col ms-sm4",
      },
      zip: {
        classNames: "ms-Grid-col ms-sm4",
      },
    },
  },
  formData: {},
};
