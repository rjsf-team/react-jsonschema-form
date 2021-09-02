"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

function TextWidget(props) {
  var BaseInput = props.registry.widgets.BaseInput;
  return _react["default"].createElement(BaseInput, props);
}

if (process.env.NODE_ENV !== "production") {
  TextWidget.propTypes = {
    value: _propTypes["default"].oneOfType([_propTypes["default"].string, _propTypes["default"].number]),
    id: _propTypes["default"].string
  };
}

var _default = TextWidget;
exports["default"] = _default;