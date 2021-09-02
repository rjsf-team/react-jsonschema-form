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

function RadioWidget(props) {
  var options = props.options,
      value = props.value,
      required = props.required,
      disabled = props.disabled,
      readonly = props.readonly,
      autofocus = props.autofocus,
      onBlur = props.onBlur,
      onFocus = props.onFocus,
      _onChange = props.onChange,
      id = props.id;
  var isDataLoaded = true;

  if (props.isDataLoaded !== undefined) {
    isDataLoaded = props.isDataLoaded;
  } // Generating a unique field name to identify this set of radio buttons


  var name = Math.random().toString();
  var enumOptions = options.enumOptions,
      enumDisabled = options.enumDisabled,
      inline = options.inline; // checked={checked} has been moved above name={name}, As mentioned in #349;
  // this is a temporary fix for radio button rendering bug in React, facebook/react#7630.

  return _react["default"].createElement(_react["default"].Fragment, null, (value == null || value === "" || value === undefined) && !isDataLoaded && _react["default"].createElement(_reactLoadingSkeleton["default"], null), (value || isDataLoaded) && _react["default"].createElement("div", {
    className: "field-radio-group",
    id: id
  }, enumOptions.map(function (option, i) {
    var checked = option.value === value;
    var itemDisabled = enumDisabled && enumDisabled.indexOf(option.value) != -1;
    var disabledCls = disabled || itemDisabled || readonly ? "disabled" : "";

    var radio = _react["default"].createElement("span", null, _react["default"].createElement("input", {
      type: "radio",
      checked: checked,
      name: name,
      id: "".concat(id, "_").concat(i),
      className: "custom-control-input",
      required: required,
      value: option.value,
      disabled: disabled || itemDisabled || readonly,
      autoFocus: autofocus && i === 0,
      onChange: function onChange(_) {
        return _onChange(option.value);
      },
      onBlur: onBlur && function (event) {
        return onBlur(id, event.target.value);
      },
      onFocus: onFocus && function (event) {
        return onFocus(id, event.target.value);
      }
    }), _react["default"].createElement("label", {
      className: "custom-control-label",
      htmlFor: "".concat(id, "_").concat(i)
    }, option.label));

    return inline ? _react["default"].createElement("div", {
      key: i,
      className: "custom-control custom-radio custom-control-inline ".concat(disabledCls)
    }, radio) : _react["default"].createElement("div", {
      key: i,
      className: "custom-control custom-radio ".concat(disabledCls)
    }, radio);
  })));
}

RadioWidget.defaultProps = {
  autofocus: false
};

if (process.env.NODE_ENV !== "production") {
  RadioWidget.propTypes = {
    schema: _propTypes["default"].object.isRequired,
    id: _propTypes["default"].string.isRequired,
    options: _propTypes["default"].shape({
      enumOptions: _propTypes["default"].array,
      inline: _propTypes["default"].bool
    }).isRequired,
    value: _propTypes["default"].any,
    required: _propTypes["default"].bool,
    disabled: _propTypes["default"].bool,
    readonly: _propTypes["default"].bool,
    autofocus: _propTypes["default"].bool,
    onChange: _propTypes["default"].func
  };
}

var _default = RadioWidget;
exports["default"] = _default;