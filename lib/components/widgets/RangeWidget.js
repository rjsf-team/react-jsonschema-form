"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _utils = require("../../utils");

function RangeWidget(props) {
  var schema = props.schema,
      value = props.value,
      BaseInput = props.registry.widgets.BaseInput;
  return _react["default"].createElement("div", {
    className: "field-range-wrapper"
  }, _react["default"].createElement(BaseInput, (0, _extends2["default"])({
    type: "range"
  }, props, (0, _utils.rangeSpec)(schema))), _react["default"].createElement("span", {
    className: "range-view"
  }, value));
}

if (process.env.NODE_ENV !== "production") {
  RangeWidget.propTypes = {
    value: _propTypes["default"].oneOfType([_propTypes["default"].string, _propTypes["default"].number])
  };
}

var _default = RangeWidget;
exports["default"] = _default;