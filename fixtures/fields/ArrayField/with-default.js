module.exports = {
  schema: {
    type: "array",
    title: "title",
    default: ["default1", "default2"],
    items: {
      type: "string",
      title: "item"
    }
  },
  onChange: console.log.bind(console)
};
