"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = AddButton;

var _react = _interopRequireDefault(require("react"));

var _IconButton = _interopRequireDefault(require("./IconButton"));

function AddButton(_ref) {
  var className = _ref.className,
      onClick = _ref.onClick,
      disabled = _ref.disabled,
      textValue = _ref.textValue,
      typeValue = _ref.typeValue;
  return _react["default"].createElement("div", {
    className: "row"
  }, _react["default"].createElement("div", {
    className: "col-12"
  }, _react["default"].createElement("p", {
    className: "".concat(className)
  }, _react["default"].createElement(_IconButton["default"], {
    type: typeValue
    /* 
    icon="plus" */
    ,
    text: textValue,
    className: "btn-add btn-sm",
    tabIndex: "0",
    onClick: onClick,
    disabled: disabled
  }))));
}