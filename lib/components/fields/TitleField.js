"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var REQUIRED_FIELD_SYMBOL = "*";

function TitleField(props) {
  var id = props.id,
      title = props.title,
      required = props.required;

  var legend = required ? title + REQUIRED_FIELD_SYMBOL : title;
  return _react2.default.createElement(
    "legend",
    { id: id },
    legend
  );
}

if (process.env.NODE_ENV !== "production") {
  TitleField.propTypes = {
    id: _react.PropTypes.string,
    title: _react.PropTypes.string,
    required: _react.PropTypes.bool
  };
}

exports.default = TitleField;