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
              "type": "string",
              "default": ""
            },
            {
              "title": "integer",
              "type": "integer",
              "default": 0
            },
            {
              "title": "array",
              "type": "array",
              "items": {
                "anyOf": [
                  {
                    "title": "string",
                    "type": "string",
                    "default": ""
                  },
                  {
                    "title": "integer",
                    "type": "integer",
                    "default": 0
                  }
                ]
              },
              "default": [""],
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
