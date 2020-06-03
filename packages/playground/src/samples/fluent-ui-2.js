module.exports = {
  schema: {
    title: "Fluent UI demo 2",
    type: "object",
    required: ["name", "agree"],
    properties: {
      name: {
        type: "string",
      },
      agree: {
        type: "boolean",
        title: "I agree to the terms and conditions.",
      },
      interests: {
        type: "array",
        items: {
          type: "string",
          enum: ["a", "b", "c"],
        },
        uniqueItems: true,
        minItems: 1,
      },
      description: {
        type: "string",
      },
    },
  },
  uiSchema: {
    interests: {
      "ui:widget": "checkboxes",
    },
    description: {
      "ui:widget": "textarea",
    },
  },
  formData: {},
};
