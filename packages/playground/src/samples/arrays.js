module.exports = {
  schema: {
    definitions: {
      Thing: {
        type: "object",
        properties: {
          name: {
            type: "string",
            default: "Default name",
          },
        },
      },
    },
    type: "object",
    properties: {
      listOfStrings: {
        type: "array",
        title: "A list of strings",
        items: {
          type: "string",
          default: "bazinga",
        },
      },
      multipleChoicesList: {
        type: "array",
        title: "A multiple choices list",
        items: {
          type: "string",
          enum: ["foo", "bar", "fuzz", "qux"],
        },
        uniqueItems: true,
      },
      fixedItemsList: {
        type: "array",
        title: "A list of fixed items",
        items: [
          {
            title: "A string value",
            type: "string",
            default: "lorem ipsum",
          },
          {
            title: "a boolean value",
            type: "boolean",
          },
        ],
        additionalItems: {
          title: "Additional item",
          type: "number",
        },
      },
      minItemsList: {
        type: "array",
        title: "A list with a minimal number of items",
        minItems: 3,
        items: {
          $ref: "#/definitions/Thing",
        },
      },
      defaultsAndMinItems: {
        type: "array",
        title: "List and item level defaults",
        minItems: 5,
        default: ["carp", "trout", "bream"],
        items: {
          type: "string",
          default: "unidentified",
        },
      },
      nestedList: {
        type: "array",
        title: "Nested list",
        items: {
          type: "array",
          title: "Inner list",
          items: {
            type: "string",
            default: "lorem ipsum",
          },
        },
      },
      unorderable: {
        title: "Unorderable items",
        type: "array",
        items: {
          type: "string",
          default: "lorem ipsum",
        },
      },
      unremovable: {
        title: "Unremovable items",
        type: "array",
        items: {
          type: "string",
          default: "lorem ipsum",
        },
      },
      uncopyable: {
        title: "Uncopyable items",
        type: "array",
        items: {
          type: "string",
          default: "lorem ipsum",
        },
      },
      noToolbar: {
        title: "No add, remove, copy and order buttons",
        type: "array",
        items: {
          type: "string",
          default: "lorem ipsum",
        },
      },
      fixedNoToolbar: {
        title: "Fixed array without buttons",
        type: "array",
        items: [
          {
            title: "A number",
            type: "number",
            default: 42,
          },
          {
            title: "A boolean",
            type: "boolean",
            default: false,
          },
        ],
        additionalItems: {
          title: "A string",
          type: "string",
          default: "lorem ipsum",
        },
      },
    },
  },
  uiSchema: {
    listOfStrings: {
      items: { "ui:emptyValue": "" },
    },
    multipleChoicesList: {
      "ui:widget": "checkboxes",
    },
    fixedItemsList: {
      items: [{ "ui:widget": "textarea" }, { "ui:widget": "select" }],
      additionalItems: {
        "ui:widget": "updown",
      },
    },
    unorderable: {
      "ui:options": {
        orderable: false,
      },
    },
    unremovable: {
      "ui:options": {
        removable: false,
      },
    },
    uncopyable: {
      "ui:options": {
        copyable: false,
      },
    },
    noToolbar: {
      "ui:options": {
        addable: false,
        orderable: false,
        removable: false,
        copyable: false,
      },
    },
    fixedNoToolbar: {
      "ui:options": {
        addable: false,
        orderable: false,
        removable: false,
        copyable: false,
      },
    },
  },
  formData: {
    listOfStrings: ["foo", "bar"],
    multipleChoicesList: ["foo", "bar"],
    fixedItemsList: ["Some text", true, 123],
    nestedList: [["lorem", "ipsum"], ["dolor"]],
    unorderable: ["one", "two"],
    unremovable: ["one", "two"],
    uncopyable: ["one", "two"],
    noToolbar: ["one", "two"],
    fixedNoToolbar: [42, true, "additional item one", "additional item two"],
  },
};
