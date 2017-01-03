"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _utils = require("../../utils");

var _BaseInput = require("./BaseInput");

var _BaseInput2 = _interopRequireDefault(_BaseInput);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function UpDownWidget(props) {
  return _react2.default.createElement(_BaseInput2.default, _extends({ type: "number" }, props, (0, _utils.rangeSpec)(props.schema)));
}

if (process.env.NODE_ENV !== "production") {
  UpDownWidget.propTypes = {
    value: _react.PropTypes.oneOfType([_react.PropTypes.number, _react.PropTypes.string])
  };
}

exports.default = UpDownWidget;