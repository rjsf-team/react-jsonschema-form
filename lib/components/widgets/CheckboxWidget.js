"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactLoadingSkeleton = _interopRequireDefault(require("react-loading-skeleton"));

var _DescriptionField = _interopRequireDefault(require("../fields/DescriptionField.js"));

// Check to see if a schema specifies that a value must be true
function schemaRequiresTrueValue(schema) {
  // Check if const is a truthy value
  if (schema["const"]) {
    return true;
  } // Check if an enum has a single value of true


  if (schema["enum"] && schema["enum"].length === 1 && schema["enum"][0] === true) {
    return true;
  } // If anyOf has a single value, evaluate the subschema


  if (schema.anyOf && schema.anyOf.length === 1) {
    return schemaRequiresTrueValue(schema.anyOf[0]);
  } // If oneOf has a single value, evaluate the subschema


  if (schema.oneOf && schema.oneOf.length === 1) {
    return schemaRequiresTrueValue(schema.oneOf[0]);
  } // Evaluate each subschema in allOf, to see if one of them requires a true
  // value


  if (schema.allOf) {
    return schema.allOf.some(schemaRequiresTrueValue);
  }
}

function CheckboxWidget(props) {
  var schema = props.schema,
      hideLabel = props.schema.hideLabel,
      id = props.id,
      value = props.value,
      disabled = props.disabled,
      readonly = props.readonly,
      label = props.label,
      autofocus = props.autofocus,
      onBlur = props.onBlur,
      onFocus = props.onFocus,
      _onChange = props.onChange;
  var isDataLoaded = true;

  if (props.isDataLoaded !== undefined) {
    isDataLoaded = props.isDataLoaded;
  } // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords


  var required = schemaRequiresTrueValue(schema);
  return _react["default"].createElement(_react["default"].Fragment, null, (value == null || value === "" || value === undefined) && !isDataLoaded && _react["default"].createElement(_reactLoadingSkeleton["default"], null), (value || isDataLoaded) && _react["default"].createElement("div", {
    className: "custom-control custom-checkbox ".concat(disabled || readonly ? "disabled" : "")
  }, schema.description && _react["default"].createElement(_DescriptionField["default"], {
    description: schema.description
  }), _react["default"].createElement("input", {
    type: "checkbox",
    id: id,
    className: "custom-control-input",
    checked: typeof value === "undefined" ? false : value,
    required: required,
    disabled: disabled || readonly,
    autoFocus: autofocus,
    onChange: function onChange(event) {
      return _onChange(event.target.checked);
    },
    onBlur: onBlur && function (event) {
      return onBlur(id, event.target.checked);
    },
    onFocus: onFocus && function (event) {
      return onFocus(id, event.target.checked);
    }
  }), _react["default"].createElement("label", {
    className: "custom-control-label",
    htmlFor: id
  }, !hideLabel && _react["default"].createElement("span", null, label))));
}

CheckboxWidget.defaultProps = {
  autofocus: false
};

if (process.env.NODE_ENV !== "production") {
  CheckboxWidget.propTypes = {
    schema: _propTypes["default"].object.isRequired,
    id: _propTypes["default"].string.isRequired,
    value: _propTypes["default"].bool,
    required: _propTypes["default"].bool,
    disabled: _propTypes["default"].bool,
    readonly: _propTypes["default"].bool,
    autofocus: _propTypes["default"].bool,
    onChange: _propTypes["default"].func
  };
}

var _default = CheckboxWidget;
exports["default"] = _default;