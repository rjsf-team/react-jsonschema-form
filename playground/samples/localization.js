import localize from "ajv-i18n";

module.exports = {
  schema: {
    type: "object",
    title: "Contextualized localization",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        title: "Nombre",
      },
      active: {
        type: "boolean",
        title: "Activo",
      },
    },
  },
  formData: {
    active: "wrong",
  },
  uiSchema: {},
  localization: localize.es,
};
