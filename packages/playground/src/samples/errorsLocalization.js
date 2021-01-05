const localize_ru = require("ajv-i18n/localize/ru");

module.exports = {
  schema: {
    title: "Контекстные ошибки",
    type: "object",

    required: ["firstName"],

    properties: {
      firstName: {
        type: "string",
        title: "Имя",
        minLength: 8,
        pattern: "\\d+",
      },
      active: {
        type: "boolean",
        title: "Активен",
      },
      skills: {
        type: "array",
        title: "Навыки",
        items: {
          type: "string",
          minLength: 5,
        },
      },
      multipleChoicesList: {
        type: "array",
        title: "Максимум 2 элемента",
        uniqueItems: true,
        maxItems: 2,
        items: {
          type: "string",
          enum: ["foo", "bar", "fuzz"],
        },
      },
    },
  },
  uiSchema: {},
  formData: {
    firstName: "Чак",
    active: "wrong",
    skills: ["каратэ", "дзюдо", "айкидо"],
    multipleChoicesList: ["foo", "bar", "baz"],
  },

  localizeErrors: localize_ru,
};
