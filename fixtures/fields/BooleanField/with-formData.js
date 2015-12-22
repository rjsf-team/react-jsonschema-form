module.exports = {
  schema: {
    type: "boolean",
    title: "My boolean",
  },
  formData: true,
  onChange: console.log.bind(console, "change")
};
