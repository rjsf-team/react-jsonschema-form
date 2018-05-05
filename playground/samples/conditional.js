module.exports = {
  schema: {
    type: "object",
    properties: {
      ownsCar: {
        title: "Do you own a car?",
        type: "string",
        enum: ["Yes", "No"],
      },
    },
    if: {
      required: ["ownsCar"],
      properties: { ownsCar: { const: "Yes" } },
    },
    then: {
      properties: {
        carColor: {
          title: "What color is your car?",
          type: "string",
          default: "#ff0000",
        },
      },
    },
    else: { properties: { carColor: { not: {} } } },
  },
  uiSchema: {
    carColor: {
      "ui:widget": "color",
    },
  },
  formData: {},
};
