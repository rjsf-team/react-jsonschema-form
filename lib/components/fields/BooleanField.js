"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _utils = require("../../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function BooleanField(props) {
  var schema = props.schema,
      name = props.name,
      uiSchema = props.uiSchema,
      idSchema = props.idSchema,
      formData = props.formData,
      registry = props.registry,
      required = props.required,
      disabled = props.disabled,
      readonly = props.readonly,
      autofocus = props.autofocus,
      onChange = props.onChange;
  var title = schema.title;
  var widgets = registry.widgets,
      formContext = registry.formContext;

  var _getUiOptions = (0, _utils.getUiOptions)(uiSchema),
      _getUiOptions$widget = _getUiOptions.widget,
      widget = _getUiOptions$widget === undefined ? "checkbox" : _getUiOptions$widget,
      options = _objectWithoutProperties(_getUiOptions, ["widget"]);

  var Widget = (0, _utils.getWidget)(schema, widget, widgets);
  var enumOptions = (0, _utils.optionsList)({
    enum: [true, false],
    enumNames: schema.enumNames || ["yes", "no"]
  });
  return _react2.default.createElement(Widget, {
    options: _extends({}, options, { enumOptions: enumOptions }),
    schema: schema,
    id: idSchema && idSchema.$id,
    onChange: onChange,
    label: title === undefined ? name : title,
    value: (0, _utils.defaultFieldValue)(formData, schema),
    required: required,
    disabled: disabled,
    readonly: readonly,
    registry: registry,
    formContext: formContext,
    autofocus: autofocus });
}

if (process.env.NODE_ENV !== "production") {
  BooleanField.propTypes = {
    schema: _react.PropTypes.object.isRequired,
    uiSchema: _react.PropTypes.object,
    idSchema: _react.PropTypes.object,
    onChange: _react.PropTypes.func.isRequired,
    formData: _react.PropTypes.bool,
    required: _react.PropTypes.bool,
    disabled: _react.PropTypes.bool,
    readonly: _react.PropTypes.bool,
    autofocus: _react.PropTypes.bool,
    registry: _react.PropTypes.shape({
      widgets: _react.PropTypes.objectOf(_react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.object])).isRequired,
      fields: _react.PropTypes.objectOf(_react.PropTypes.func).isRequired,
      definitions: _react.PropTypes.object.isRequired,
      formContext: _react.PropTypes.object.isRequired
    })
  };
}

BooleanField.defaultProps = {
  uiSchema: {},
  registry: (0, _utils.getDefaultRegistry)(),
  disabled: false,
  readonly: false,
  autofocus: false
};

exports.default = BooleanField;