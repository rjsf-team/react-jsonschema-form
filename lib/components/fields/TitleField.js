"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var REQUIRED_FIELD_SYMBOL = "*";

function TitleField(props) {
  var id = props.id,
      title = props.title,
      required = props.required;
  return _react["default"].createElement("h5", {
    id: id,
    className: "control-label"
  }, title, required && _react["default"].createElement("span", {
    className: "required"
  }, REQUIRED_FIELD_SYMBOL));
}

if (process.env.NODE_ENV !== "production") {
  TitleField.propTypes = {
    id: _propTypes["default"].string,
    title: _propTypes["default"].string,
    required: _propTypes["default"].bool
  };
}

var _default = TitleField;
exports["default"] = _default;