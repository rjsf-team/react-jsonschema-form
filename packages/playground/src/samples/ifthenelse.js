module.exports = {
  schema: {
    type: "object",
    properties: {
      country: {
        enum: ["United States of America", "Canada"],
      },
    },
    if: {
      properties: {
        country: {
          const: "United States of America",
        },
      },
    },
    then: {
      properties: {
        zip_code: {
          type: "string",
        },
      },
    },
    else: {
      properties: {
        postal_code: {
          type: "string",
        },
      },
    },
  },
  uiSchema: {},
  formData: {},
};
