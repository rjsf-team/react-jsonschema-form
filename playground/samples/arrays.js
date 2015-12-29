module.exports = {
  schema: {
    type: "array",
    title: "A list of strings",
    items: {
      type: "string",
      default: "bazinga"
    }
  },
  uiSchema: {},
  formData: ["foo", "bar"]
};
