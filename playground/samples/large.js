function largeEnum(n) {
  const list = [];
  for (let i=0; i<n;i++) {
    list.push("option #" + i);
  }
  return list;
}

module.exports = {
  schema: {
    title: "A rather large form",
    type: "object",
    properties: {
      string: {
        type: "string",
        title: "Some string",
      },
      choice1: {type: "string", enum: largeEnum(100)},
      choice2: {type: "string", enum: largeEnum(100)},
      choice3: {type: "string", enum: largeEnum(100)},
      choice4: {type: "string", enum: largeEnum(100)},
      choice5: {type: "string", enum: largeEnum(100)},
      choice6: {type: "string", enum: largeEnum(100)},
      choice7: {type: "string", enum: largeEnum(100)},
      choice8: {type: "string", enum: largeEnum(100)},
      choice9: {type: "string", enum: largeEnum(100)},
      choice10: {type: "string", enum: largeEnum(100)},
    }
  },
  uiSchema: {},
  formData: {}
};
