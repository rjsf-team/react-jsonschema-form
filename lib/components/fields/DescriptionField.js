"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

function DescriptionField(props) {
  var id = props.id,
      description = props.description;

  if (!description) {
    return null;
  }

  if (typeof description === "string") {
    return _react["default"].createElement("p", {
      id: id,
      className: "field-description"
    }, description);
  } else {
    return _react["default"].createElement("div", {
      id: id,
      className: "field-description"
    }, description);
  }
}

if (process.env.NODE_ENV !== "production") {
  DescriptionField.propTypes = {
    id: _propTypes["default"].string,
    description: _propTypes["default"].oneOfType([_propTypes["default"].string, _propTypes["default"].element])
  };
}

var _default = DescriptionField;
exports["default"] = _default;