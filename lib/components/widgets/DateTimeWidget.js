"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.utcToLocal = utcToLocal;
exports.localToUTC = localToUTC;
exports["default"] = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _utils = require("../../utils");

function utcToLocal(jsonDate) {
  if (!jsonDate) {
    return "";
  } // required format of `"yyyy-MM-ddThh:mm" followed by optional ":ss" or ":ss.SSS"
  // https://html.spec.whatwg.org/multipage/input.html#local-date-and-time-state-(type%3Ddatetime-local)
  // > should be a _valid local date and time string_ (not GMT)
  // Note - date constructor passed local ISO-8601 does not correctly
  // change time to UTC in node pre-8


  var date = new Date(jsonDate);
  var yyyy = (0, _utils.pad)(date.getFullYear(), 4);
  var MM = (0, _utils.pad)(date.getMonth() + 1, 2);
  var dd = (0, _utils.pad)(date.getDate(), 2);
  var hh = (0, _utils.pad)(date.getHours(), 2);
  var mm = (0, _utils.pad)(date.getMinutes(), 2);
  var ss = (0, _utils.pad)(date.getSeconds(), 2);
  var SSS = (0, _utils.pad)(date.getMilliseconds(), 3);
  return "".concat(yyyy, "-").concat(MM, "-").concat(dd, "T").concat(hh, ":").concat(mm, ":").concat(ss, ".").concat(SSS);
}

function localToUTC(dateString) {
  if (dateString) {
    return new Date(dateString).toJSON();
  }
}

function DateTimeWidget(props) {
  var value = props.value,
      _onChange = props.onChange,
      BaseInput = props.registry.widgets.BaseInput;
  return _react["default"].createElement(BaseInput, (0, _extends2["default"])({
    type: "datetime-local"
  }, props, {
    value: utcToLocal(value),
    onChange: function onChange(value) {
      return _onChange(localToUTC(value));
    }
  }));
}

if (process.env.NODE_ENV !== "production") {
  DateTimeWidget.propTypes = {
    value: _propTypes["default"].string
  };
}

var _default = DateTimeWidget;
exports["default"] = _default;