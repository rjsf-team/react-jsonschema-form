module.exports = {
  schema: {
    type: "object",
    properties: {
      number: {
        title: "Number",
        type: "number"
      },
      integer: {
        title: "Integer",
        type: "integer"
      },
      numberEnum: {
        type: "number",
        title: "Number enum",
        enum: [1, 2, 3]
      }
    }
  },
  uiSchema: {},
  formData: {
    number: 3.14,
    integer: 42,
    numberEnum: 2
  }
};
