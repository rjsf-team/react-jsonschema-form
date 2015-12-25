module.exports = {
  schema: {
    title: "Todo Tasks",
    type: "object",
    required: ["title"],
    properties: {
      title: {type: "string", title: "Title", default: "A new task"},
      done: {type: "boolean", title: "Done?", default: false}
    }
  },
  formData: {
    title: "First task",
    done: true
  }
};
