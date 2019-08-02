module.exports = {
  schema: {
    title: "Extra error example",
    description: "A form with an extra error on the firstName property.",
    type: "object",
    required: ["firstName", "lastName"],
    properties: {
      firstName: {
        type: "string",
        title: "First name",
      },
      lastName: {
        type: "string",
        title: "Last name",
      },
    },
  },
  uiSchema: {
    firstName: {
      "ui:autofocus": true,
      "ui:emptyValue": "",
    },
  },
  formData: {
    firstName: "Chuck",
    lastName: "Norris",
  },
  extraErrors: [
    {
      property: ".firstName",
      message: "An extra error, could be added asynchronously.",
      stack: ".firstName has an extra error, could be added asynchronously.",
    },
  ],
};
