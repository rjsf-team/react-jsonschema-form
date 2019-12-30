module.exports = {
  schema: {
    definitions: {
      locations: {
        enumNames: ["New York", "Amsterdam", "Hong Kong"],
        enum: [
          {
            name: "New York",
            lat: 40,
            lon: 74,
          },
          {
            name: "Amsterdam",
            lat: 52,
            lon: 5,
          },
          {
            name: "Hong Kong",
            lat: 22,
            lon: 114,
          },
        ],
      },
    },
    type: "object",
    properties: {
      location: {
        title: "Location",
        $ref: "#/definitions/locations",
      },
      multiSelect: {
        type: "array",
        uniqueItems: true,
        items: {
          $ref: "#/definitions/locations",
        },
      },
    },
  },
  formData: {
    location: {
      name: "Amsterdam",
      lat: 52,
      lon: 5,
    },
  },
};
