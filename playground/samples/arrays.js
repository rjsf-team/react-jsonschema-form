module.exports = {
  schema: {
    type: "object",
    properties: {
      listOfStrings: {
        type: "array",
        title: "A list of strings",
        items: {
          type: "string",
          default: "bazinga"
        }
      },
      multipleChoicesList: {
        type: "array",
        title: "A multiple choices list",
        items: {
          type: "string",
          enum: ["foo", "bar", "fuzz", "qux"],
        },
        uniqueItems: true
      },
      fixedItemsList: {
        type: "array",
        title: "A list of fixed items",
        items: [
          {
            title: "A string value",
            type: "string",
            default: "lorem ipsum"
          },
          {
            title: "a boolean value",
            type: "boolean"
          }
        ],
        additionalItems: {
          title: "Additional item",
          type: "number"
        }
      },
      nestedList: {
        type: "array",
        title: "Nested list",
        items: {
          type: "array",
          title: "Inner list",
          items: {
            type: "string",
            default: "lorem ipsum"
          }
        }
      }
    }
  },
  uiSchema: {
    multipleChoicesList: {
      "ui:widget": "checkboxes"
    },
    fixedItemsList: {
      items: [
        {"ui:widget": "textarea"},
        {"ui:widget": "select"}
      ],
      additionalItems: {
        "ui:widget": "updown"
      }
    }
  },
  formData: {
    listOfStrings: ["foo", "bar"],
    multipleChoicesList: ["foo", "bar"],
    fixedItemsList: ["Some text", true, 123],
    nestedList: [["lorem", "ipsum"], ["dolor"]]
  }
};
