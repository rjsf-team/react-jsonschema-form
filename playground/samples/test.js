module.exports = {
  schema: {
    type: "object",
    properties: {
      "multipleChoicesList": {
        "type": "array",
        "title": "A multiple choices list",
        "items": {
          "type": "number",
          "enum": [
            1,
            2,
            3,
            4
          ]
        },
        "uniqueItems": true
      },
    }
  },
  uiSchema: {},
  formData: {}
};
