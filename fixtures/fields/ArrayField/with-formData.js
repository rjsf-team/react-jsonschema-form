module.exports = {
  schema: {
    type: "array",
    title: "title",
    items: {
      type: "string",
      title: "item"
    }
  },
  formData: ["item1", "item2"],
  onChange: console.log.bind(console)
};
