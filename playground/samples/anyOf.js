module.exports = {
  schema: {
    "title": "Any of",
    "type": "object",
    "properties": {
      "List of widgets": {
        "type": "array",
        "items": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "number"
            }
          ]
        }
      }
    }
  },
  uiSchema: {},
  formData: {}
};
