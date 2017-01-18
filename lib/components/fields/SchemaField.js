"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _utils = require("../../utils");

var _UnsupportedField = require("./UnsupportedField");

var _UnsupportedField2 = _interopRequireDefault(_UnsupportedField);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var REQUIRED_FIELD_SYMBOL = "*";
var COMPONENT_TYPES = {
  array: "ArrayField",
  boolean: "BooleanField",
  integer: "NumberField",
  number: "NumberField",
  object: "ObjectField",
  string: "StringField"
};

function getFieldComponent(schema, uiSchema, fields) {
  var field = uiSchema["ui:field"];
  if (typeof field === "function") {
    return field;
  }
  if (typeof field === "string" && field in fields) {
    return fields[field];
  }
  var componentName = COMPONENT_TYPES[schema.type];
  return componentName in fields ? fields[componentName] : _UnsupportedField2.default;
}

function Label(props) {
  var label = props.label,
      required = props.required,
      id = props.id;

  if (!label) {
    // See #312: Ensure compatibility with old versions of React.
    return _react2.default.createElement("div", null);
  }
  return _react2.default.createElement(
    "label",
    { className: "control-label", htmlFor: id },
    required ? label + REQUIRED_FIELD_SYMBOL : label
  );
}

function Help(props) {
  var help = props.help;

  if (!help) {
    // See #312: Ensure compatibility with old versions of React.
    return _react2.default.createElement("div", null);
  }
  if (typeof help === "string") {
    return _react2.default.createElement(
      "p",
      { className: "help-block" },
      help
    );
  }
  return _react2.default.createElement(
    "div",
    { className: "help-block" },
    help
  );
}

function ErrorList(props) {
  var _props$errors = props.errors,
      errors = _props$errors === undefined ? [] : _props$errors;

  if (errors.length === 0) {
    return _react2.default.createElement("div", null);
  }
  return _react2.default.createElement(
    "div",
    null,
    _react2.default.createElement("p", null),
    _react2.default.createElement(
      "ul",
      { className: "error-detail bs-callout bs-callout-info" },
      errors.map(function (error, index) {
        return _react2.default.createElement(
          "li",
          { className: "text-danger", key: index },
          error
        );
      })
    )
  );
}

function DefaultTemplate(props) {
  var id = props.id,
      classNames = props.classNames,
      label = props.label,
      children = props.children,
      errors = props.errors,
      help = props.help,
      description = props.description,
      hidden = props.hidden,
      required = props.required,
      displayLabel = props.displayLabel;

  if (hidden) {
    return children;
  }

  return _react2.default.createElement(
    "div",
    { className: classNames },
    displayLabel ? _react2.default.createElement(Label, { label: label, required: required, id: id }) : null,
    displayLabel && description ? description : null,
    children,
    errors,
    help
  );
}

if (process.env.NODE_ENV !== "production") {
  DefaultTemplate.propTypes = {
    id: _react.PropTypes.string,
    classNames: _react.PropTypes.string,
    label: _react.PropTypes.string,
    children: _react.PropTypes.node.isRequired,
    errors: _react.PropTypes.element,
    rawErrors: _react.PropTypes.arrayOf(_react.PropTypes.string),
    help: _react.PropTypes.element,
    rawHelp: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.element]),
    description: _react.PropTypes.element,
    rawDescription: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.element]),
    hidden: _react.PropTypes.bool,
    required: _react.PropTypes.bool,
    readonly: _react.PropTypes.bool,
    displayLabel: _react.PropTypes.bool,
    fields: _react.PropTypes.object,
    formContext: _react.PropTypes.object
  };
}

DefaultTemplate.defaultProps = {
  hidden: false,
  readonly: false,
  required: false,
  displayLabel: true
};

function SchemaField(props) {
  var uiSchema = props.uiSchema,
      errorSchema = props.errorSchema,
      idSchema = props.idSchema,
      name = props.name,
      required = props.required,
      registry = props.registry;
  var definitions = registry.definitions,
      fields = registry.fields,
      formContext = registry.formContext,
      _registry$FieldTempla = registry.FieldTemplate,
      FieldTemplate = _registry$FieldTempla === undefined ? DefaultTemplate : _registry$FieldTempla;

  var schema = (0, _utils.retrieveSchema)(props.schema, definitions);
  var FieldComponent = getFieldComponent(schema, uiSchema, fields);
  var DescriptionField = fields.DescriptionField;

  var disabled = Boolean(props.disabled || uiSchema["ui:disabled"]);
  var readonly = Boolean(props.readonly || uiSchema["ui:readonly"]);
  var autofocus = Boolean(props.autofocus || uiSchema["ui:autofocus"]);

  if (Object.keys(schema).length === 0) {
    // See #312: Ensure compatibility with old versions of React.
    return _react2.default.createElement("div", null);
  }

  var displayLabel = true;
  if (schema.type === "array") {
    displayLabel = (0, _utils.isMultiSelect)(schema) || (0, _utils.isFilesArray)(schema, uiSchema);
  }
  if (schema.type === "object") {
    displayLabel = false;
  }
  if (schema.type === "boolean" && !uiSchema["ui:widget"]) {
    displayLabel = false;
  }
  if (uiSchema["ui:field"]) {
    displayLabel = false;
  }

  var __errors = errorSchema.__errors,
      fieldErrorSchema = _objectWithoutProperties(errorSchema, ["__errors"]);

  var field = _react2.default.createElement(FieldComponent, _extends({}, props, {
    schema: schema,
    disabled: disabled,
    readonly: readonly,
    autofocus: autofocus,
    errorSchema: fieldErrorSchema,
    formContext: formContext }));

  var type = schema.type;

  var id = idSchema.$id;
  var label = props.schema.title || schema.title || name;
  var description = props.schema.description || schema.description;
  var errors = __errors;
  var help = uiSchema["ui:help"];
  var hidden = uiSchema["ui:widget"] === "hidden";
  var classNames = ["form-group", "field", "field-" + type, errors && errors.length > 0 ? "field-error has-error" : "", uiSchema.classNames].join(" ").trim();

  var fieldProps = {
    description: _react2.default.createElement(DescriptionField, { id: id + "__description",
      description: description,
      formContext: formContext }),
    rawDescription: description,
    help: _react2.default.createElement(Help, { help: help }),
    rawHelp: typeof help === "string" ? help : undefined,
    errors: _react2.default.createElement(ErrorList, { errors: errors }),
    rawErrors: errors,
    id: id,
    label: label,
    hidden: hidden,
    required: required,
    readonly: readonly,
    displayLabel: displayLabel,
    classNames: classNames,
    formContext: formContext,
    fields: fields,
    schema: schema,
    uiSchema: uiSchema
  };

  return _react2.default.createElement(
    FieldTemplate,
    fieldProps,
    field
  );
}

SchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
  idSchema: {},
  registry: (0, _utils.getDefaultRegistry)(),
  disabled: false,
  readonly: false,
  autofocus: false
};

if (process.env.NODE_ENV !== "production") {
  SchemaField.propTypes = {
    schema: _react.PropTypes.object.isRequired,
    uiSchema: _react.PropTypes.object,
    idSchema: _react.PropTypes.object,
    formData: _react.PropTypes.any,
    errorSchema: _react.PropTypes.object,
    registry: _react.PropTypes.shape({
      widgets: _react.PropTypes.objectOf(_react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.object])).isRequired,
      fields: _react.PropTypes.objectOf(_react.PropTypes.func).isRequired,
      definitions: _react.PropTypes.object.isRequired,
      FieldTemplate: _react.PropTypes.func,
      formContext: _react.PropTypes.object.isRequired
    })
  };
}

exports.default = SchemaField;