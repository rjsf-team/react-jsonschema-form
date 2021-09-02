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

function selectValue(value, selected, all) {
  var at = all.indexOf(value);
  var updated = selected.concat({ "key": value }); // As inserting values at predefined index positions doesn't work with empty
  // arrays, we need to reorder the updated selection to match the initial order

  return updated.sort(function (a, b) {
    return all.indexOf(a) > all.indexOf(b);
  });
}

function deselectValue(value, selected) {
  return selected.filter(function (v) {
    return v.key !== value;
  });
}

function CheckboxesWidget(props) {
  var id = props.id,
      disabled = props.disabled,
      options = props.options,
      value = props.value,
      autofocus = props.autofocus,
      readonly = props.readonly,
      _onChange = props.onChange,
      onBlur = props.onBlur;
  var enumOptions = options.enumOptions,
      enumDisabled = options.enumDisabled,
      inline = options.inline;
  var isDataLoaded = true;

  if (props.isDataLoaded !== undefined) {
    isDataLoaded = props.isDataLoaded;
  }

  return _react["default"].createElement(_react["default"].Fragment, null, (value == null || value === "" || value === undefined) && !isDataLoaded && _react["default"].createElement(_reactLoadingSkeleton["default"], null), (value || isDataLoaded) && _react["default"].createElement("div", {
    className: "checkboxes",
    id: id,
    onMouseLeave: onBlur && function () {
      return onBlur(value);
    }
  }, enumOptions.map(function (option, index) {
    var checked = false;
    value.map((part, index) => {
      if (part.key === option.value) {
        checked = true;
      }
    });
    var itemDisabled = enumDisabled && enumDisabled.indexOf(option.value) != -1;
    var disabledCls = disabled || itemDisabled || readonly ? "disabled" : "";

    var checkbox = _react["default"].createElement("span", null, _react["default"].createElement("input", {
      type: "checkbox",
      id: "".concat(id, "_").concat(index),
      className: "custom-control-input",
      checked: checked,
      disabled: disabled || itemDisabled || readonly,
      autoFocus: autofocus && index === 0,
      onChange: function onChange(event) {
        var all = enumOptions.map(function (_ref) {
          var value = _ref.value;
          return value;
        });

        if (event.target.checked) {
          _onChange(selectValue(option.value, value, all));
        } else {
          _onChange(deselectValue(option.value, value));
        }
      }
    }), _react["default"].createElement("label", {
      className: "custom-control-label",
      htmlFor: "".concat(id, "_").concat(index)
    }, option.label));

    return inline ? _react["default"].createElement("div", {
      key: index,
      className: "custom-control custom-checkbox custom-control-inline ".concat(disabledCls)
    }, checkbox) : _react["default"].createElement("div", {
      key: index,
      className: "custom-control custom-checkbox ".concat(disabledCls)
    }, checkbox);
  })));
}

CheckboxesWidget.defaultProps = {
  autofocus: false,
  options: {
    inline: false
  }
};

if (process.env.NODE_ENV !== "production") {
  CheckboxesWidget.propTypes = {
    schema: _propTypes["default"].object.isRequired,
    id: _propTypes["default"].string.isRequired,
    options: _propTypes["default"].shape({
      enumOptions: _propTypes["default"].array,
      inline: _propTypes["default"].bool
    }).isRequired,
    value: _propTypes["default"].any,
    required: _propTypes["default"].bool,
    readonly: _propTypes["default"].bool,
    disabled: _propTypes["default"].bool,
    multiple: _propTypes["default"].bool,
    autofocus: _propTypes["default"].bool,
    onChange: _propTypes["default"].func
  };
}

var _default = CheckboxesWidget;
exports["default"] = _default;