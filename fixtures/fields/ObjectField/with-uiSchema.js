module.exports = {
  schema: {
    type: "object",
    title: "object title",
    properties: {
      string: {
        type: "string",
        title: "string"
      },
      bool: {
        type: "boolean",
        title: "bool"
      }
    }
  },
  uiSchema: {
    string: {
      widget: "textarea"
    },
    bool: {
      widget: "select"
    }
  },
  onChange: console.log.bind(console, "change")
};
