module.exports = {
  schema: {
    type: "boolean",
    title: "My boolean"
  },
  uiSchema: {
    widget: "radio"
  },
  formData: false,
  onChange: console.log.bind(console, "change")
};
