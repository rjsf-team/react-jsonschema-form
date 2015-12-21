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
  onChange: console.log.bind(console)
};
