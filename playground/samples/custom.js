module.exports = {
  schema: {
    title: "A localisation form",
    type: "object",
    required: ["lat", "lon"],
    properties: {
      lat: {
        type: "number",
        title: "Latitude",
      },
      lon: {
        type: "number",
        title: "Longitude",
      }
    }
  },
  uiSchema: {
    "ui:field": "geo"
  },
  formData: {
    lat: 0,
    lon: 0
  }
};
