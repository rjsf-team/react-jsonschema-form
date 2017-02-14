module.exports = {
  schema: {
    title: "Contextualized errors",
    type: "object",
    properties: {
      firstName: {
        type: "string",
        title: "First name",
        minLength: 8,
        pattern: "\\d+",
        "description": "Note: this field isn't required, but will be validated for length and pattern as soon as a value is entered.",
      },
      active: {
        type: "boolean",
        title: "Active"
      },
      skills: {
        type: "array",
        items: {
          type: "string",
          minLength: 5
        }
      },
      multipleChoicesList: {
        type: "array",
        title: "Pick max two items",
        uniqueItems: true,
        maxItems: 2,
        items: {
          type: "string",
          enum: ["foo", "bar", "fuzz"]
        }
      }
    }
  },
  uiSchema: {},
  formData: {
    firstName: "Chuck",
    active: "wrong",
    skills: ["karate", "budo", "aikido"],
    multipleChoicesList: ["foo", "bar", "fuzz"]
  }
};
