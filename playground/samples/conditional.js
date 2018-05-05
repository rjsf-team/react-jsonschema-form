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
      required: ["referrer"],
      properties: { referrer: { enum: ["Other (please specify)"] } },
    },
    then: { properties: { referrerOther: { title: "Other", type: "string" } } },
    else: { properties: { referrerOther: { not: {} } } },
  },
  uiSchema: {},
  formData: {},
};
