"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _BaseInput = require("./BaseInput");

var _BaseInput2 = _interopRequireDefault(_BaseInput);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function URLWidget(props) {
  return _react2.default.createElement(_BaseInput2.default, _extends({ type: "url" }, props));
}

if (process.env.NODE_ENV !== "production") {
  URLWidget.propTypes = {
    value: _react.PropTypes.string
  };
}

exports.default = URLWidget;