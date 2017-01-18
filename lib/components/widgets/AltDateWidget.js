"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _utils = require("../../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function rangeOptions(type, start, stop) {
  var options = [{ value: -1, label: type }];
  for (var i = start; i <= stop; i++) {
    options.push({ value: i, label: (0, _utils.pad)(i, 2) });
  }
  return options;
}

function readyForChange(state) {
  return Object.keys(state).every(function (key) {
    return state[key] !== -1;
  });
}

function DateElement(props) {
  var type = props.type,
      range = props.range,
      value = props.value,
      select = props.select,
      rootId = props.rootId,
      disabled = props.disabled,
      readonly = props.readonly,
      autofocus = props.autofocus,
      registry = props.registry;

  var id = rootId + "_" + type;
  var SelectWidget = registry.widgets.SelectWidget;

  return _react2.default.createElement(SelectWidget, {
    schema: { type: "integer" },
    id: id,
    className: "form-control",
    options: { enumOptions: rangeOptions(type, range[0], range[1]) },
    value: value,
    disabled: disabled,
    readonly: readonly,
    autofocus: autofocus,
    onChange: function onChange(value) {
      return select(type, value);
    } });
}

var AltDateWidget = function (_Component) {
  _inherits(AltDateWidget, _Component);

  function AltDateWidget(props) {
    _classCallCheck(this, AltDateWidget);

    var _this = _possibleConstructorReturn(this, (AltDateWidget.__proto__ || Object.getPrototypeOf(AltDateWidget)).call(this, props));

    _this.onChange = function (property, value) {
      _this.setState(_defineProperty({}, property, value), function () {
        // Only propagate to parent state if we have a complete date{time}
        if (readyForChange(_this.state)) {
          _this.props.onChange((0, _utils.toDateString)(_this.state, _this.props.time));
        }
      });
    };

    _this.onBlur = function () {
      if (_this.props.onBlur) {
        _this.props.onBlur((0, _utils.toDateString)(_this.state, _this.props.time));
      }
    };

    _this.setNow = function (event) {
      event.preventDefault();
      var _this$props = _this.props,
          time = _this$props.time,
          disabled = _this$props.disabled,
          readonly = _this$props.readonly,
          onChange = _this$props.onChange;

      if (disabled || readonly) {
        return;
      }
      var nowDateObj = (0, _utils.parseDateString)(new Date().toJSON(), time);
      _this.setState(nowDateObj, function () {
        return onChange((0, _utils.toDateString)(_this.state, time));
      });
    };

    _this.clear = function (event) {
      event.preventDefault();
      var _this$props2 = _this.props,
          time = _this$props2.time,
          disabled = _this$props2.disabled,
          readonly = _this$props2.readonly,
          onChange = _this$props2.onChange;

      if (disabled || readonly) {
        return;
      }
      _this.setState((0, _utils.parseDateString)("", time), function () {
        return onChange(undefined);
      });
    };

    _this.state = (0, _utils.parseDateString)(props.value, props.time);
    return _this;
  }

  _createClass(AltDateWidget, [{
    key: "componentWillReceiveProps",
    value: function componentWillReceiveProps(nextProps) {
      this.setState((0, _utils.parseDateString)(nextProps.value, nextProps.time));
    }
  }, {
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps, nextState) {
      return (0, _utils.shouldRender)(this, nextProps, nextState);
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          id = _props.id,
          disabled = _props.disabled,
          readonly = _props.readonly,
          autofocus = _props.autofocus,
          registry = _props.registry;

      return _react2.default.createElement(
        "ul",
        { className: "list-inline" },
        this.dateElementProps.map(function (elemProps, i) {
          return _react2.default.createElement(
            "li",
            { key: i },
            _react2.default.createElement(DateElement, _extends({
              rootId: id,
              select: _this2.onChange
            }, elemProps, {
              disabled: disabled,
              readonly: readonly,
              registry: registry,
              autofocus: autofocus && i === 0 }))
          );
        }),
        _react2.default.createElement(
          "li",
          null,
          _react2.default.createElement(
            "a",
            { href: "#", className: "btn btn-info btn-now",
              onClick: this.setNow },
            "Now"
          )
        ),
        _react2.default.createElement(
          "li",
          null,
          _react2.default.createElement(
            "a",
            { href: "#", className: "btn btn-warning btn-clear",
              onClick: this.clear },
            "Clear"
          )
        )
      );
    }
  }, {
    key: "dateElementProps",
    get: function get() {
      var time = this.props.time;
      var _state = this.state,
          year = _state.year,
          month = _state.month,
          day = _state.day,
          hour = _state.hour,
          minute = _state.minute,
          second = _state.second;

      var data = [{ type: "year", range: [1900, 2020], value: year }, { type: "month", range: [1, 12], value: month }, { type: "day", range: [1, 31], value: day }];
      if (time) {
        data.push({ type: "hour", range: [0, 23], value: hour }, { type: "minute", range: [0, 59], value: minute }, { type: "second", range: [0, 59], value: second });
      }
      return data;
    }
  }]);

  return AltDateWidget;
}(_react.Component);

AltDateWidget.defaultProps = {
  time: false,
  disabled: false,
  readonly: false,
  autofocus: false
};


if (process.env.NODE_ENV !== "production") {
  AltDateWidget.propTypes = {
    schema: _react.PropTypes.object.isRequired,
    id: _react.PropTypes.string.isRequired,
    value: _react2.default.PropTypes.string,
    required: _react.PropTypes.bool,
    disabled: _react.PropTypes.bool,
    readonly: _react.PropTypes.bool,
    autofocus: _react.PropTypes.bool,
    onChange: _react.PropTypes.func,
    onBlur: _react.PropTypes.func,
    time: _react.PropTypes.bool
  };
}

exports.default = AltDateWidget;