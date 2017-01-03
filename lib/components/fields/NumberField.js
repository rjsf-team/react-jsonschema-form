"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _utils = require("../../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function NumberField(props) {
  var StringField = props.registry.fields.StringField;

  return _react2.default.createElement(StringField, _extends({}, props, {
    onChange: function onChange(value) {
      return props.onChange((0, _utils.asNumber)(value));
    } }));
}

if (process.env.NODE_ENV !== "production") {
  NumberField.propTypes = {
    schema: _react.PropTypes.object.isRequired,
    uiSchema: _react.PropTypes.object,
    idSchema: _react.PropTypes.object,
    onChange: _react.PropTypes.func.isRequired,
    formData: _react.PropTypes.oneOfType([_react.PropTypes.number, _react.PropTypes.string]),
    required: _react.PropTypes.bool,
    formContext: _react.PropTypes.object.isRequired
  };
}

NumberField.defaultProps = {
  uiSchema: {}
};

exports.default = NumberField;