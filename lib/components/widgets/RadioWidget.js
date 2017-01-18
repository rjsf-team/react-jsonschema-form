"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function RadioWidget(_ref) {
  var schema = _ref.schema,
      options = _ref.options,
      value = _ref.value,
      required = _ref.required,
      disabled = _ref.disabled,
      autofocus = _ref.autofocus,
      _onChange = _ref.onChange,
      _onBlur = _ref.onBlur;

  // Generating a unique field name to identify this set of radio buttons
  var name = Math.random().toString();
  var enumOptions = options.enumOptions,
      inline = options.inline;
  // checked={checked} has been moved above name={name}, As mentioned in #349;
  // this is a temporary fix for radio button rendering bug in React, facebook/react#7630.

  return _react2.default.createElement(
    "div",
    { className: "field-radio-group" },
    enumOptions.map(function (option, i) {
      var checked = option.value === value;
      var disabledCls = disabled ? "disabled" : "";
      var radio = _react2.default.createElement(
        "span",
        null,
        _react2.default.createElement("input", { type: "radio",
          checked: checked,
          name: name,
          value: option.value,
          disabled: disabled,
          autoFocus: autofocus && i === 0,
          onChange: function onChange(_) {
            return _onChange(option.value);
          },
          onBlur: function onBlur(_) {
            return _onBlur(option.value);
          } }),
        _react2.default.createElement(
          "span",
          null,
          option.label
        )
      );

      return inline ? _react2.default.createElement(
        "label",
        { key: i, className: "radio-inline " + disabledCls },
        radio
      ) : _react2.default.createElement(
        "div",
        { key: i, className: "radio " + disabledCls },
        _react2.default.createElement(
          "label",
          null,
          radio
        )
      );
    })
  );
}

RadioWidget.defaultProps = {
  autofocus: false
};

if (process.env.NODE_ENV !== "production") {
  RadioWidget.propTypes = {
    schema: _react.PropTypes.object.isRequired,
    id: _react.PropTypes.string.isRequired,
    options: _react.PropTypes.shape({
      enumOptions: _react.PropTypes.array,
      inline: _react.PropTypes.bool
    }).isRequired,
    value: _react.PropTypes.any,
    required: _react.PropTypes.bool,
    autofocus: _react.PropTypes.bool,
    onChange: _react.PropTypes.func,
    onBlur: _react.PropTypes.func
  };
}
exports.default = RadioWidget;