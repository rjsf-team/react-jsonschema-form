module.exports = {
  schema: {
    title: "Widgets",
    type: "object",
    properties: {
      boolean: {
        type: "object",
        title: "Boolean field",
        properties: {
          default: {
            type: "boolean",
            title: "checkbox (default)"
          },
          radio: {
            type: "boolean",
            title: "radio buttons"
          },
          select: {
            type: "boolean",
            title: "select box"
          }
        }
      },
      string: {
        type: "object",
        title: "String field",
        properties: {
          default: {
            type: "string",
            title: "text input (default)"
          },
          textarea: {
            type: "string",
            title: "textarea"
          }
        }
      },
      stringFormats: {
        type: "object",
        title: "String formats",
        properties: {
          email: {
            type: "string",
            format: "email"
          },
          uri: {
            type: "string",
            format: "uri"
          },
          datetime: {
            type: "string",
            format: "date-time"
          },
          date: {
            type: "string",
            format: "date-time"
          }
        }
      },
      secret: {
        type: "string",
        default: "I'm a hidden string."
      }
    }
  },
  uiSchema: {
    boolean: {
      radio: {
        "ui:widget": "radio"
      },
      select: {
        "ui:widget": "select"
      }
    },
    string: {
      textarea: {
        "ui:widget": "textarea"
      }
    },
    stringFormats: {
      date: {
        "ui:widget": "date"
      }
    },
    secret: {
      "ui:widget": "hidden"
    }
  },
  formData: {
    boolean: {
      default: true,
      radio: true,
      select: true
    },
    string: {
      default: "Hello...",
      textarea: "... World"
    },
    stringFormats: {
      email: "chuck@norris.net",
      uri: "http://chucknorris.com/",
    },
    secret: "I'm a hidden string."
  }
};
