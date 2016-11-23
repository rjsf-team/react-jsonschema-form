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
              "title": "string",
              "type": "string"
            },
            {
              "title": "integer",
              "type": "integer"
            },
            {
              "title": "array",
              "type": "array",
              "items": {
                "anyOf": [
                  {
                    "title": "string",
                    "type": "string"
                  },
                  {
                    "title": "integer",
                    "type": "integer"
                  }
                ]
              }
            }
          ]
        }
      }
    }
  },
  uiSchema: {},
  formData: {
    "List of widgets": [
      27,
      "Batman",
      [
        "Bruce",
        "Wayne"
      ]
    ]
  }
};
