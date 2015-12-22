module.exports = {
  schema: {
    type: "array",
    title: "title",
    items: {
      type: "string",
      title: "item"
    }
  },
  uiSchema: {
    items: {
      widget: "textarea"
    }
  },
  formData: ["item1", "item2"],
  onChange: console.log.bind(console, "change")
};
