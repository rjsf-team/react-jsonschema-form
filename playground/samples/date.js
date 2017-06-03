module.exports = {
  schema: {
    title: "Date and time widgets",
    type: "object",
    properties: {
      native: {
        title: "Native",
        description:
          "May not work on some browsers, notably Firefox Desktop and IE.",
        type: "object",
        properties: {
          datetime: {
            type: "string",
            format: "date-time",
          },
          date: {
            type: "string",
            format: "date",
          },
        },
      },
      alternative: {
        title: "Alternative",
        description: "These work on most platforms.",
        type: "object",
        properties: {
          "alt-datetime": {
            type: "string",
            format: "date-time",
          },
          "alt-date": {
            type: "string",
            format: "date",
          },
        },
      },
    },
  },
  uiSchema: {
    alternative: {
      "alt-datetime": {
        "ui:widget": "alt-datetime",
      },
      "alt-date": {
        "ui:widget": "alt-date",
      },
    },
  },
  formData: {},
};
