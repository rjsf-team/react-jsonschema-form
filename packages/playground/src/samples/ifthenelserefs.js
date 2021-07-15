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
      $ref: "#/definitions/us",
    },
    else: {
      $ref: "#/definitions/other",
    },
    definitions: {
      us: {
        properties: {
          zip_code: {
            type: "string",
          },
        },
      },
      other: {
        properties: {
          postal_code: {
            type: "string",
          },
        },
      },
    },
  },
  uiSchema: {},
  formData: {},
};
