module.exports = {
  type: "string",
  label: "foo",
  defaultValue: "b",
  options: ["a", "b"],
  onChange: console.log.bind(console)
};
