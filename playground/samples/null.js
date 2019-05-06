module.exports = {
  schema: {
    title: "Null field example",
    description: "A short form with a null field",
    type: "object",
    properties: {
      NullableInObject: {
        type: "object",
        properties: {
          CarpoolInd: {
            type: "boolean",
            default: false,
          },
        },
        dependencies: {
          CarpoolInd: {
            oneOf: [
              {
                properties: {
                  CarpoolInd: {
                    const: true,
                  },
                  NumPassengers: {
                    type: "integer",
                  },
                },
                required: ["NumPassengers"],
              },
              {
                properties: {
                  CarpoolInd: {
                    const: false,
                  },
                  NumPassengers: {
                    type: "null",
                  },
                },
              },
            ],
          },
        },
      },
      NullableInArray: {
        type: "array",
        items: {
          type: "object",
          properties: {
            CarpoolInd: {
              type: "boolean",
              default: false,
            },
          },
          dependencies: {
            CarpoolInd: {
              oneOf: [
                {
                  properties: {
                    CarpoolInd: {
                      const: true,
                    },
                    NumPassengers: {
                      type: "integer",
                    },
                  },
                  required: ["NumPassengers"],
                },
                {
                  properties: {
                    CarpoolInd: {
                      const: false,
                    },
                    NumPassengers: {
                      type: "null",
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  },
  uiSchema: {},
  formData: {},
};
