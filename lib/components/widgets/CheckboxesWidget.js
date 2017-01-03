"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function selectValue(value, selected, all) {
  var at = all.indexOf(value);
  var updated = selected.slice(0, at).concat(value, selected.slice(at));
  // As inserting values at predefined index positions doesn't work with empty
  // arrays, we need to reorder the updated selection to match the initial order
  return updated.sort(function (a, b) {
    return all.indexOf(a) > all.indexOf(b);
  });
}

function deselectValue(value, selected) {
  return selected.filter(function (v) {
    return v !== value;
  });
}

function CheckboxesWidget(props) {
  var _this = this;

  var id = props.id,
      disabled = props.disabled,
      options = props.options,
      value = props.value,
      autofocus = props.autofocus,
      _onChange = props.onChange,
      _onBlur = props.onBlur;
  var enumOptions = options.enumOptions,
      inline = options.inline;

  return _react2.default.createElement(
    "div",
    { className: "checkboxes", id: id },
    enumOptions.map(function (option, index) {
      var checked = value.indexOf(option.value) !== -1;
      var disabledCls = disabled ? "disabled" : "";
      var checkbox = _react2.default.createElement(
        "span",
        null,
        _react2.default.createElement("input", { type: "checkbox",
          id: id + "_" + index,
          checked: checked,
          disabled: disabled,
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
          },
          onBlur: function onBlur(event) {
            if (_onBlur) {
              _this.props.onBlur(event);
            }
          }
        }),
        _react2.default.createElement(
          "span",
          null,
          option.label
        )
      );
      return inline ? _react2.default.createElement(
        "label",
        { key: index, className: "checkbox-inline " + disabledCls },
        checkbox
      ) : _react2.default.createElement(
        "div",
        { key: index, className: "checkbox " + disabledCls },
        _react2.default.createElement(
          "label",
          null,
          checkbox
        )
      );
    })
  );
}

CheckboxesWidget.defaultProps = {
  autofocus: false,
  options: {
    inline: false
  }
};

if (process.env.NODE_ENV !== "production") {
  CheckboxesWidget.propTypes = {
    schema: _react.PropTypes.object.isRequired,
    id: _react.PropTypes.string.isRequired,
    options: _react.PropTypes.shape({
      enumOptions: _react.PropTypes.array,
      inline: _react.PropTypes.bool
    }).isRequired,
    value: _react.PropTypes.any,
    required: _react.PropTypes.bool,
    disabled: _react.PropTypes.bool,
    multiple: _react.PropTypes.bool,
    autofocus: _react.PropTypes.bool,
    onChange: _react.PropTypes.func,
    onBlur: _react.PropTypes.func
  };
}

exports.default = CheckboxesWidget;