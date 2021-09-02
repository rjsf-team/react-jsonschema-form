"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs2/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/inherits"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _Overlay = _interopRequireDefault(require("react-bootstrap/Overlay"));

var _Popover = _interopRequireDefault(require("react-bootstrap/Popover"));

var _Button = _interopRequireDefault(require("react-bootstrap/Button"));

/**
 * Class component of Confirmation
 */
var Confirmation =
/*#__PURE__*/
function (_Component) {
  (0, _inherits2["default"])(Confirmation, _Component);

  function Confirmation(props) {
    var _this;

    (0, _classCallCheck2["default"])(this, Confirmation);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(Confirmation).call(this, props)); // Initial state declaration

    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "handleClick", function (event) {
      var show = _this.state.show;

      _this.setState({
        show: !show
      });
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "handleHeaderClick", function (event) {
      var show = _this.state.show;

      if (show === false) {
        _this.setState({
          target: event.target,
          show: !show
        });
      }
    });
    _this.state = {
      show: false,
      target: null
    };
    _this.handleClick = _this.handleClick.bind((0, _assertThisInitialized2["default"])(_this));
    _this.handleHeaderClick = _this.handleHeaderClick.bind((0, _assertThisInitialized2["default"])(_this));
    return _this;
  }

  (0, _createClass2["default"])(Confirmation, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          _this$props$cancelBut = _this$props.cancelButtonText,
          cancelButtonText = _this$props$cancelBut === void 0 ? "Cancel" : _this$props$cancelBut,
          _this$props$okButtonT = _this$props.okButtonText,
          okButtonText = _this$props$okButtonT === void 0 ? "OK" : _this$props$okButtonT,
          _this$props$ButtonTex = _this$props.ButtonText,
          ButtonText = _this$props$ButtonTex === void 0 ? "Delete" : _this$props$ButtonTex,
          _this$props$headingTe = _this$props.headingText,
          headingText = _this$props$headingTe === void 0 ? "Are you sure you want to delete?" : _this$props$headingTe,
          _this$props$bodyText = _this$props.bodyText,
          bodyText = _this$props$bodyText === void 0 ? "" : _this$props$bodyText,
          _this$props$disabled = _this$props.disabled,
          disabled = _this$props$disabled === void 0 ? false : _this$props$disabled,
          _this$props$className = _this$props.className,
          className = _this$props$className === void 0 ? "mr-2" : _this$props$className,
          _this$props$variant = _this$props.variant,
          variant = _this$props$variant === void 0 ? "secondary" : _this$props$variant;
      var _this$state = this.state,
          show = _this$state.show,
          target = _this$state.target;
      return _react["default"].createElement("div", null, _react["default"].createElement(_Button["default"], {
        variant: variant,
        size: "sm",
        disabled: disabled,
        className: className,
        onClick: this.handleHeaderClick,
        title: ButtonText
      }, ButtonText), _react["default"].createElement(_Overlay["default"], {
        show: show,
        target: target,
        onHide: this.handleClick,
        placement: "bottom",
        rootClose: true
      }, _react["default"].createElement(_Popover["default"], {
        id: "popover-contained"
      }, _react["default"].createElement(_Popover["default"].Title, null, headingText), _react["default"].createElement(_Popover["default"].Content, null, bodyText, _react["default"].createElement("div", {
        className: "text-center"
      }, _react["default"].createElement(_Button["default"], {
        variant: "secondary",
        size: "sm",
        className: "mr-2",
        onClick: this.handleClick
      }, cancelButtonText), _react["default"].createElement(_Button["default"], {
        variant: "outline-primary",
        size: "sm",
        className: "mr-2",
        onClick: this.props.onConfirmation
      }, okButtonText))))));
    }
  }]);
  return Confirmation;
}(_react.Component);

exports["default"] = Confirmation;