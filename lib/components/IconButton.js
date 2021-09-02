"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = IconButton;

var _extends2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

function IconButton(props) {
  var _props$type = props.type,
      type = _props$type === void 0 ? "default" : _props$type,
      icon = props.icon,
      text = props.text,
      className = props.className,
      otherProps = (0, _objectWithoutProperties2["default"])(props, ["type", "icon", "text", "className"]);
  return _react["default"].createElement("button", (0, _extends2["default"])({
    type: "button",
    className: "btn btn-".concat(type, " ").concat(className)
  }, otherProps), icon && _react["default"].createElement("i", {
    className: "glyphicon glyphicon-".concat(icon)
  }), text && _react["default"].createElement("span", null, text));
}