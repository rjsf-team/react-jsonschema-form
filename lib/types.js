"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.fieldProps = exports.registry = void 0;

var _propTypes = _interopRequireDefault(require("prop-types"));

var registry = _propTypes["default"].shape({
  ArrayFieldTemplate: _propTypes["default"].func,
  FieldTemplate: _propTypes["default"].func,
  ObjectFieldTemplate: _propTypes["default"].func,
  definitions: _propTypes["default"].object.isRequired,
  fields: _propTypes["default"].objectOf(_propTypes["default"].func).isRequired,
  formContext: _propTypes["default"].object.isRequired,
  widgets: _propTypes["default"].objectOf(_propTypes["default"].oneOfType([_propTypes["default"].func, _propTypes["default"].object])).isRequired
});

exports.registry = registry;
var fieldProps = {
  autofocus: _propTypes["default"].bool,
  disabled: _propTypes["default"].bool,
  errorSchema: _propTypes["default"].object,
  formData: _propTypes["default"].any,
  idSchema: _propTypes["default"].object,
  onBlur: _propTypes["default"].func,
  onChange: _propTypes["default"].func.isRequired,
  onFocus: _propTypes["default"].func,
  rawErrors: _propTypes["default"].arrayOf(_propTypes["default"].string),
  readonly: _propTypes["default"].bool,
  registry: registry.isRequired,
  required: _propTypes["default"].bool,
  schema: _propTypes["default"].object.isRequired,
  uiSchema: _propTypes["default"].shape({
    "ui:options": _propTypes["default"].shape({
      addable: _propTypes["default"].bool,
      orderable: _propTypes["default"].bool,
      removable: _propTypes["default"].bool
    })
  })
};
exports.fieldProps = fieldProps;