module.exports = {
  schema: {
    type: "boolean",
    title: "My boolean",
    default: true,
  },
  onChange: console.log.bind(console)
};
