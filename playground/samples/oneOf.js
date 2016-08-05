module.exports = {
  schema: {
    "type": "object",
    "properties": {
      "multiArray": {
        "type": "array",
        "title": "OneOf Array",
        "items": {
          "oneOf": [
            {
              "type": "string",
              "title": "String"
            },
            {
              "type": "number",
              "title": "Number"
            },
            {
              "type": "object",
              "title": "Object",
              "properties": {
                "number": {
                  "type": "number",
                  "title": "Number"
                },
                "boolean": {
                  "type": "boolean",
                  "title": "boolean"
                }
              }
            }
          ]
        }
      }
    }
  },
  uiSchema: {multiArray: {"ui:field": "multiArray"}},
  formData: {}
};
