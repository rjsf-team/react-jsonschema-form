const messages = {
  required: "El campo {{missingProperty}} es requerido",
  type: "Debe ser {{type}}",
};

function convertMessagesText(typeError, params) {
  switch (typeError) {
    case "required": {
      const { missingProperty } = params;
      return messages[typeError].replace(
        "{{missingProperty}}",
        missingProperty
      );
    }
    case "type": {
      const { type } = params;
      return messages[typeError].replace(
        "{{type}}",
        Array.isArray(type) ? type.join(",") : type
      );
    }
  }
}

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
  localization: function(errors) {
    errors &&
      errors.forEach(property => {
        property.message =
          convertMessagesText(property.keyword, property.params) ||
          property.message;
      });
  },
};
