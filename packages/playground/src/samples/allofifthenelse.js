module.exports = {
  schema: {
    type: "object",
    properties: {
      country: {
        enum: [
          "United States of America",
          "United Kingdom",
          "France",
          "Germany",
        ],
        default: "United States of America",
      },
    },
    required: ["country"],
    definitions: {
      uk: {
        properties: {
          post_code: {
            type: "string",
          },
        },
      },
    },
    allOf: [
      {
        if: {
          properties: {
            country: {
              const: "United States of America",
              default: "",
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
      },
      {
        if: {
          properties: {
            country: {
              const: "United Kingdom",
              default: "",
            },
          },
        },
        then: {
          $ref: "#/definitions/uk",
        },
      },
      {
        if: {
          properties: {
            country: {
              const: "France",
              default: "",
            },
          },
        },
        then: {
          properties: {
            phone_number: {
              type: "string",
            },
          },
        },
      },
    ],
  },
  uiSchema: {},
  formData: {},
};
