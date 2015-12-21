var React = require("react");

module.exports = {
  type: "string",
  label: "foo",
  required: true,
  children: React.createElement("div", {}, "content")
};
