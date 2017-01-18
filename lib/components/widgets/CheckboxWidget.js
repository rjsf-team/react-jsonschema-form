"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function CheckboxWidget(_ref) {
  var schema = _ref.schema,
      id = _ref.id,
      value = _ref.value,
      required = _ref.required,
      disabled = _ref.disabled,
      label = _ref.label,
      autofocus = _ref.autofocus,
      _onChange = _ref.onChange,
      _onBlur = _ref.onBlur;

  return _react2.default.createElement(
    "div",
    { className: "checkbox " + (disabled ? "disabled" : "") },
    _react2.default.createElement(
      "label",
      null,
      _react2.default.createElement("input", { type: "checkbox",
        id: id,
        checked: typeof value === "undefined" ? false : value,
        required: required,
        disabled: disabled,
        autoFocus: autofocus,
        onChange: function onChange(event) {
          return _onChange(event.target.checked);
        },
        onBlur: function onBlur(event) {
          return _onBlur(event.target.checked);
        } }),
      _react2.default.createElement(
        "span",
        null,
        label
      )
    )
  );
}

CheckboxWidget.defaultProps = {
  autofocus: false
};

if (process.env.NODE_ENV !== "production") {
  CheckboxWidget.propTypes = {
    schema: _react.PropTypes.object.isRequired,
    id: _react.PropTypes.string.isRequired,
    value: _react.PropTypes.bool,
    required: _react.PropTypes.bool,
    autofocus: _react.PropTypes.bool,
    onChange: _react.PropTypes.func,
    onBlur: _react.PropTypes.func
  };
}

exports.default = CheckboxWidget;