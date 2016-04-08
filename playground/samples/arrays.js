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
          enum: ["foo", "bar", "fuzz"],
        },
        uniqueItems: true
      },
      fixedItemsList: {
        type: "array",
        title: "A list of fixed items",
        items: [
          {
            title: "Item 1",
            type: "string",
            default: "lorem ipsum"
          },
          {
            title: "Item 2",
            type: "integer"
          }
        ]
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
  uiSchema: {},
  formData: {
    listOfStrings: ["foo", "bar"],
    multipleChoicesList: ["foo", "bar"],
    fixedItemsList: ["Some text", 123],
    nestedList: [["lorem", "ipsum"], ["dolor"]]
  }
};
