module.exports = {
  schema: {
    type: "object",
    properties: {
      listOfStrings: {
        type: "array",
        title: "A list of strings",
        items: {
          type: "string",
          default: "bazinga"
        }
      },
      multipleChoicesList: {
        type: "array",
        title: "A multiple choices list",
        items: {
          type: "string",
          enum: ["foo", "bar", "fuzz"],
        },
        uniqueItems: true
      }
    }
  },
  uiSchema: {},
  formData: {
    listOfStrings: ["foo", "bar"],
    multipleChoicesList: ["foo", "bar"]
  }
};
