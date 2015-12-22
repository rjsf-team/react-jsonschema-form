module.exports = {
  type: "string",
  label: "foo",
  options: ["foo", "bar", "baz"],
  onChange: console.log.bind(console, "change")
};
