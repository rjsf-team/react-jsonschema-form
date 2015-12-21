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
        description: "Is that task done already?"
      },
      title: {
        type: "string",
        title: "Title",
        description: "The task title.",
        minLength: 1
      }
    }
  },
  onSubmit: console.log.bind(console, "submit"),
  onError: console.log.bind(console, "errors")
};
