module.exports = {
  schema: {
    type: "object",
    title: "object title",
    default: {
      string: "a default string",
      bool: true
    },
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
  onChange: console.log.bind(console)
};
