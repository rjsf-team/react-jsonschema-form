module.exports = {
  schema: {
    title: "Contextualized errors",
    type: "object",
    required: ["planet"],
    properties: {
      active: {
        type: "boolean",
        title: "Active",
      },
      firstName: {
        type: "string",
        title: "First name",
        minLength: 8,
        pattern: "\\d+",
      },
      multipleChoicesList: {
        type: "array",
        title: "Pick max two items",
        uniqueItems: true,
        maxItems: 2,
        items: {
          type: "string",
          enum: ["foo", "bar", "fuzz"],
        },
      },
      skills: {
        type: "array",
        items: {
          type: "string",
          minLength: 5,
        },
      },
      planet: {
        type: "string",
        title: "Home planet",
      },
    },
  },
  uiSchema: {
    "ui:order": ["firstName", "active", "skills", "*"],
  },
  formData: {
    firstName: "Chuck",
    active: "wrong",
    skills: ["karate", "budo", "aikido"],
    multipleChoicesList: ["foo", "bar", "fuzz"],
  },
};
