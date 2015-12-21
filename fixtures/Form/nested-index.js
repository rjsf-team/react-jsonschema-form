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
            done: {
              type: "boolean",
              title: "Done?",
              description: "Is that task done already?"
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
  onSubmit: console.log.bind(console, "submit"),
  onError: console.log.bind(console, "errors")
};
