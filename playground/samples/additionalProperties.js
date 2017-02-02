module.exports = {
  schema: {
    "title": "A registration form",
    "description": "A simple form example.",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "devMap": {
        "type": "object",
        "additionalProperties": {
          "type": "integer"
        }
      }
    }
  },
  uiSchema: {},
  formData: {
    "name": "test",
    "devMap": {
      "key": 2,
      "value": 12
    }
  }
};
