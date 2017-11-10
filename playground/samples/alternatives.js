module.exports = {
  schema: {
    definitions: {
      Color: {
        title: "Color",
        type: "string",
        anyOf: [
          {
            type: "string",
            enum: ["#ff0000"],
            title: "Red",
          },
          {
            type: "string",
            enum: ["#00ff00"],
            title: "Green",
          },
          {
            type: "string",
            enum: ["#0000ff"],
            title: "Blue",
          },
        ],
      },
    },
    title: "Image editor",
    type: "object",
    required: ["currentColor", "colorMask", "blendMode"],
    properties: {
      currentColor: {
        $ref: "#/definitions/Color",
        title: "Brush color",
      },
      colorMask: {
        type: "array",
        uniqueItems: true,
        items: {
          $ref: "#/definitions/Color",
        },
        title: "Color mask",
      },
      colorPalette: {
        type: "array",
        title: "Color palette",
        items: {
          $ref: "#/definitions/Color",
        },
      },
      blendMode: {
        title: "Blend mode",
        type: "string",
        enum: ["screen", "multiply", "overlay"],
        enumNames: ["Screen", "Multiply", "Overlay"],
      },
    },
  },
  uiSchema: {
    blendMode: {
      "ui:enumDisabled": ["multiply"],
    },
  },
  formData: {
    currentColor: "#00ff00",
    colorMask: ["#0000ff"],
    colorPalette: ["#ff0000"],
    blendMode: "screen",
  },
};
