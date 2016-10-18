module.exports = {
  schema: {
    type: "object",
    properties: {
      visible: {
        type: "string",
        title: "Inspect elements below",
      },
      hiddenString: {
        type: "string",
        title: "First name",
      },
      hiddenNumber: {
        title: "Number",
        type: "number"
      },
      hiddenArray: {
        type: "array",
        title: "A hidden list",
        items: {
          type: "string",
          enum: ["foo", "bar", "baz"],
        }
      },
    }
  },
  uiSchema: {
    hiddenString: {
      "ui:widget": "hidden"
    },
    hiddenNumber: {
      "ui:widget": "hidden"
    },
    hiddenArray: {
      "ui:widget": "hidden"
    }    
  },
  formData: {
    visible: 'To see some hidden items...',
    hiddenString: 'John Doe',
    hiddenNumber: 42,
    hiddenArray: ["foo", "bar"]
  }
};
