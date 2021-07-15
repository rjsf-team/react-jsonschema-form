module.exports = {
  schema: {
    type: "object",
    properties: {
      street_address: {
        type: "string",
      },
      country: {
        default: "United States of America",
        enum: ["United States of America", "Canada"],
      },
    },
    if: {
      properties: { country: { const: "United States of America" } },
    },
    then: {
      properties: {
        zip_code: {
          type: "string",
          pattern: "[0-9]{5}(-[0-9]{4})?",
        },
      },
    },
    else: {
      properties: {
        postal_code: {
          type: "string",
          pattern: "[A-Z][0-9][A-Z] [0-9][A-Z][0-9]",
        },
      },
    },
  },
};
