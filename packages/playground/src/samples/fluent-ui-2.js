module.exports = {
  schema: {
    title: "Fluent UI demo 2",
    type: "object",
    required: ["name", "agree"],
    properties: {
      name: {
        type: "string",
      },
      age: {
        type: "integer",
        minimum: 0,
        maximum: 100,
      },
      amount: {
        type: "number",
        minimum: 5,
        maximum: 500,
        multipleOf: 0.1,
      },
      agree: {
        type: "boolean",
        title: "I agree to the terms and conditions.",
      },
      interests: {
        // TODO: fix bug in which title doesn't show up if not explicitly specified.
        title: "Interests",
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
      description_autoAdjust: {
        type: "string",
        title: "Description (auto adjust height)",
      },
    },
  },
  uiSchema: {
    age: {
      "ui:widget": "updown",
    },
    amount: {
      "ui:widget": "updown",
    },
    interests: {
      "ui:widget": "checkboxes",
    },
    description: {
      "ui:widget": "textarea",
    },
    description_autoAdjust: {
      "ui:widget": "textarea",
      "ui:props": {
        autoAdjustHeight: true,
        rows: 1,
      },
    },
  },
  formData: {},
};
