module.exports = {
  schema: {
    type: "array",
    title: "title",
    items: {
      type: "string",
      title: "item"
    }
  },
  onChange: console.log.bind(console)
};
