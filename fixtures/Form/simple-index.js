module.exports = {
  schema: {
    title: "Todo Tasks",
    description: "Tasks collection.",
    type: "object",
    additionalProperties: false,
    required: [
      "title"
    ],
    properties: {
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
        minLength: 1,
        default: "default value"
      }
    }
  },
  onSubmit: console.log.bind(console, "submit"),
  onError: console.log.bind(console, "errors")
};
