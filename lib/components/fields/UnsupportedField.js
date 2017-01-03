"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = UnsupportedField;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function UnsupportedField(_ref) {
  var schema = _ref.schema;

  // XXX render json as string so dev can inspect faulty subschema
  return _react2.default.createElement(
    "div",
    { className: "unsupported-field" },
    "Unsupported field schema ",
    JSON.stringify(schema, null, 2),
    "."
  );
}