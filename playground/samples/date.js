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
          time: {
            type: "string",
            format: "time",
          },
          time_with_step: {
            title: "Time with Step attribute",
            type: "string",
            format: "time",
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
    native: {
      time_with_step: {
        "ui:options": {
          step: 1,
        },
      },
    },
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
