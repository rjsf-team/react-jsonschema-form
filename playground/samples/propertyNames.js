export default {
  schema: {
    title: "A customizable form",
    description: "A simple form with property names validation example.",
    type: "object",
    required: ["patternValidation", "enumValidation"],
    properties: {
      enumValidation: {
        type: "object",
        title: "Property names dropdown",
        additionalProperties: true,
        propertyNames: {
          enum: ["prop1", "prop2"],
        },
      },
      patternValidation: {
        type: "object",
        title: "Only digits as property names",
        additionalProperties: true,
        propertyNames: {
          type: "string",
          pattern: "^\\d*$",
        },
      },
    },
  },
  formData: {
    patternValidation: {
      123: "One two three",
    },
    enumValidation: {
      prop1: "valid property name from enum",
      invalidProp: "invalid property name from enum",
    },
  },
};
