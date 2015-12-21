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
  formData: {
    string: "an existing string",
    bool: true
  },
  onChange: console.log.bind(console)
};
