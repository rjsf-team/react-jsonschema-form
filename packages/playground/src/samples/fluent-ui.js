module.exports = {
  schema: {
    title: "Fluent UI demo",
    type: "object",
    properties: {
      name: {
        type: "string",
      },
      other: {
        type: "string",
        readOnly: true,
      },
      other2: {
        type: "string",
      },
      hidden: {
        type: "string",
      },
      url: {
        type: "string",
      },
      underlined: {
        type: "string",
        title: "Underlined field",
      },
      grid1: {
        type: "object",
        properties: {
          line1: {
            title: "Address Line 1",
            type: "string",
          },
          line2: {
            title: "Address Line 2",
            type: "string",
          },
          city: {
            title: "City",
            type: "string",
          },
          state: {
            title: "State",
            type: "string",
          },
          zip: {
            title: "Zipcode",
            type: "string",
          },
        },
      },
    },
  },
  uiSchema: {
    url: {
      "ui:props": {
        prefix: "https://",
        suffix: ".com",
      },
    },
    other2: {
      "ui:disabled": true,
    },
    hidden: {
      "ui:widget": "hidden",
    },
    underlined: {
      "ui:props": {
        underlined: true,
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
