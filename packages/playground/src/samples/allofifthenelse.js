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
      },
    },
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
      // USA
      {
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
      },
      // United Kingdom
      {
        if: {
          properties: {
            country: {
              const: "United Kingdom",
            },
          },
        },
        then: {
          $ref: "#/definitions/uk",
        },
      },
      // United Kingdom
      {
        if: {
          properties: {
            country: {
              const: "France",
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
