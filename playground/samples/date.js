module.exports = {
  schema: {
    title: "Date and time widgets",
    type: "object",
    properties: {
      native: {
        title: "Native",
        description: "May not work on some browsers, notably Firefox Desktop and IE.",
        type: "object",
        properties: {
          "datetime": {
            type: "string",
            format: "date-time"
          },
          "date": {
            type: "string",
            format: "date-time"
          }
        }
      },
      alternative: {
        title: "Alternative",
        description: "These work on every platform.",
        type: "object",
        properties: {
          "alt-datetime": {
            type: "string",
            format: "date-time"
          },
          "alt-date": {
            type: "string",
            format: "date-time"
          }
        }
      }
    }
  },
  uiSchema: {
    native: {
      date: {
        "ui:widget": "date"
      }
    },
    alternative: {
      "alt-datetime": {
        "ui:widget": "alt-datetime"
      },
      "alt-date": {
        "ui:widget": "alt-date"
      }
    }
  },
  formData: {}
};
