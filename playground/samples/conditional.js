module.exports = {
  schema: {
    type: "object",
    properties: {
      referrer: {
        title: "How did you hear about us?",
        type: "string",
        enum: ["Friends", "Family", "Internet", "Other (please specify)"],
      },
    },
    if: {
      properties: { referrer: { const: "Other (please specify)" } },
    },
    then: { properties: { referrerOther: { title: "Other", type: "string" } } },
    else: { properties: { referrerOther: { not: {} } } },
  },
  uiSchema: {},
  formData: {},
};
