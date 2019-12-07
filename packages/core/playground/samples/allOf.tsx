export default {
  schema: {
    type: "object",
    allOf: [
      {
        properties: {
          lorem: {
            type: ["string", "number"],
          },
        },
      },
      {
        properties: {
          lorem: {
            type: "boolean",
            minLength: 5,
          },
          ipsum: {
            type: "string",
          },
        },
      },
    ],
  },
  formData: {},
};
