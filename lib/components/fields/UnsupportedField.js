"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/json/stringify"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

function UnsupportedField(_ref) {
  var schema = _ref.schema,
      idSchema = _ref.idSchema,
      reason = _ref.reason;
  return _react["default"].createElement("div", {
    className: "unsupported-field"
  }, _react["default"].createElement("p", null, "Unsupported field schema", idSchema && idSchema.$id && _react["default"].createElement("span", null, " for", " field ", _react["default"].createElement("code", null, idSchema.$id)), reason && _react["default"].createElement("em", null, ": ", reason), "."), schema && _react["default"].createElement("pre", null, (0, _stringify["default"])(schema, null, 2)));
}

if (process.env.NODE_ENV !== "production") {
  UnsupportedField.propTypes = {
    schema: _propTypes["default"].object.isRequired,
    idSchema: _propTypes["default"].object,
    reason: _propTypes["default"].string
  };
}

var _default = UnsupportedField;
exports["default"] = _default;