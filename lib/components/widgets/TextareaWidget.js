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

function TextareaWidget(props) {
  var id = props.id,
      options = props.options,
      placeholder = props.placeholder,
      value = props.value,
      required = props.required,
      disabled = props.disabled,
      readonly = props.readonly,
      autofocus = props.autofocus,
      onChange = props.onChange,
      onBlur = props.onBlur,
      onFocus = props.onFocus;
  var isDataLoaded = true;

  if (props.isDataLoaded !== undefined) {
    isDataLoaded = props.isDataLoaded;
  }

  var _onChange = function _onChange(_ref) {
    var value = _ref.target.value;
    return onChange(value === "" ? options.emptyValue : value);
  };

  return _react["default"].createElement(_react["default"].Fragment, null, (value == null || value === "" || value === undefined) && !isDataLoaded && _react["default"].createElement(_reactLoadingSkeleton["default"], null), (value || isDataLoaded) && _react["default"].createElement("textarea", {
    id: id,
    className: "form-control",
    value: typeof value === "undefined" ? "" : value,
    placeholder: placeholder,
    required: required,
    disabled: disabled,
    "data-cy": props["data-cy"],
    readOnly: readonly,
    autoFocus: autofocus,
    rows: options.rows,
    onBlur: onBlur && function (event) {
      return onBlur(id, event.target.value);
    },
    onFocus: onFocus && function (event) {
      return onFocus(id, event.target.value);
    },
    onChange: _onChange
  }));
}

TextareaWidget.defaultProps = {
  autofocus: false,
  options: {}
};

if (process.env.NODE_ENV !== "production") {
  TextareaWidget.propTypes = {
    schema: _propTypes["default"].object.isRequired,
    id: _propTypes["default"].string.isRequired,
    placeholder: _propTypes["default"].string,
    options: _propTypes["default"].shape({
      rows: _propTypes["default"].number
    }),
    value: _propTypes["default"].string,
    required: _propTypes["default"].bool,
    disabled: _propTypes["default"].bool,
    readonly: _propTypes["default"].bool,
    autofocus: _propTypes["default"].bool,
    onChange: _propTypes["default"].func,
    onBlur: _propTypes["default"].func,
    onFocus: _propTypes["default"].func
  };
}

var _default = TextareaWidget;
exports["default"] = _default;