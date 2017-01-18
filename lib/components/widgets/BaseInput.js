"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function BaseInput(props) {
  // Note: since React 15.2.0 we can't forward unknown element attributes, so we
  // exclude the "options" and "schema" ones here.
  var value = props.value,
      readonly = props.readonly,
      autofocus = props.autofocus,
      _onChange = props.onChange,
      _onBlur = props.onBlur,
      options = props.options,
      schema = props.schema,
      formContext = props.formContext,
      registry = props.registry,
      inputProps = _objectWithoutProperties(props, ["value", "readonly", "autofocus", "onChange", "onBlur", "options", "schema", "formContext", "registry"]);

  return _react2.default.createElement("input", _extends({}, inputProps, {
    className: "form-control",
    readOnly: readonly,
    autoFocus: autofocus,
    value: typeof value === "undefined" ? "" : value,
    onChange: function onChange(event) {
      return _onChange(event.target.value);
    },
    onBlur: function onBlur(event) {
      if (_onBlur) {
        return _onBlur(event.target.id);
      }
    } }));
}

BaseInput.defaultProps = {
  type: "text",
  required: false,
  disabled: false,
  readonly: false,
  autofocus: false
};

if (process.env.NODE_ENV !== "production") {
  BaseInput.propTypes = {
    id: _react.PropTypes.string.isRequired,
    placeholder: _react.PropTypes.string,
    value: _react.PropTypes.any,
    required: _react.PropTypes.bool,
    disabled: _react.PropTypes.bool,
    readonly: _react.PropTypes.bool,
    autofocus: _react.PropTypes.bool,
    onChange: _react.PropTypes.func,
    onBlur: _react.PropTypes.func
  };
}

exports.default = BaseInput;