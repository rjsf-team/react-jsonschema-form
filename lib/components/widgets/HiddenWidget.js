"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function HiddenWidget(_ref) {
  var id = _ref.id,
      value = _ref.value;

  return _react2.default.createElement("input", { type: "hidden", id: id, value: typeof value === "undefined" ? "" : value });
}

if (process.env.NODE_ENV !== "production") {
  HiddenWidget.propTypes = {
    id: _react.PropTypes.string.isRequired,
    value: _react.PropTypes.oneOfType([_react2.default.PropTypes.string, _react2.default.PropTypes.number, _react2.default.PropTypes.bool])
  };
}

exports.default = HiddenWidget;