module.exports = {
  schema: {
    title: "Todo Tasks",
    description: "Tasks collection.",
    type: "object",
    additionalProperties: false,
    required: [
      "title", "tasks"
    ],
    properties: {
      title: {
        type: "string",
        title: "Tasks list title",
      },
      tasks: {
        type: "array",
        title: "Tasks list",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              title: "Category",
              enum: ["coding", "sleeping"]
            },
            done: {
              type: "boolean",
              title: "Done?",
              description: "Is that task done already?",
              default: false
            },
            title: {
              type: "string",
              title: "Title",
              description: "The task title.",
              minLength: 1
            }
          }
        }
      }
    }
  },
  uiSchema: {
    title: {
      widget: "textarea",
    },
    tasks: {
      items: {
        type: {
          widget: "radio"
        },
        done: {
          widget: "select",
        },
        title: {
          widget: "textarea"
        }
      }
    }
  },
  onSubmit: console.log.bind(console, "submit"),
  onError: console.log.bind(console, "errors")
};
