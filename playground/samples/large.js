function largeEnum(n) {
  const list = [];
  for (let i=0; i<n;i++) {
    list.push("option #" + i);
  }
  return list;
}

module.exports = {
  schema: {
    definitions: {
      largeEnum: {type: "string", enum: largeEnum(100)}
    },
    title: "A rather large form",
    type: "object",
    properties: {
      string: {
        type: "string",
        title: "Some string",
      },
      choice1: {$ref: "#/definitions/largeEnum"},
      choice2: {$ref: "#/definitions/largeEnum"},
      choice3: {$ref: "#/definitions/largeEnum"},
      choice4: {$ref: "#/definitions/largeEnum"},
      choice5: {$ref: "#/definitions/largeEnum"},
      choice6: {$ref: "#/definitions/largeEnum"},
      choice7: {$ref: "#/definitions/largeEnum"},
      choice8: {$ref: "#/definitions/largeEnum"},
      choice9: {$ref: "#/definitions/largeEnum"},
      choice10: {$ref: "#/definitions/largeEnum"},
    }
  },
  uiSchema: {
    choice1: {
      "ui:placeholder": "Choose one"
    }
  },
  formData: {}
};
