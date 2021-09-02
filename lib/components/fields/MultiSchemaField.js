"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs2/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/objectWithoutProperties"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _assign = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/assign"));

var _parseInt2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/parse-int"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/inherits"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var types = _interopRequireWildcard(require("../../types"));

var _utils = require("../../utils");

var AnyOfField =
/*#__PURE__*/
function (_Component) {
  (0, _inherits2["default"])(AnyOfField, _Component);

  function AnyOfField(props) {
    var _this;

    (0, _classCallCheck2["default"])(this, AnyOfField);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(AnyOfField).call(this, props));
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "onOptionChange", function (option) {
      var selectedOption = (0, _parseInt2["default"])(option, 10);
      var _this$props = _this.props,
          formData = _this$props.formData,
          onChange = _this$props.onChange,
          options = _this$props.options,
          registry = _this$props.registry;
      var definitions = registry.definitions;
      var newOption = (0, _utils.retrieveSchema)(options[selectedOption], definitions, formData); // If the new option is of type object and the current data is an object,
      // discard properties added using the old option.

      var newFormData = undefined;

      if ((0, _utils.guessType)(formData) === "object" && (newOption.type === "object" || newOption.properties)) {
        newFormData = (0, _assign["default"])({}, formData);
        var optionsToDiscard = options.slice();
        optionsToDiscard.splice(selectedOption, 1); // Discard any data added using other options

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = (0, _getIterator2["default"])(optionsToDiscard), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _option = _step.value;

            if (_option.properties) {
              for (var key in _option.properties) {
                if (newFormData.hasOwnProperty(key)) {
                  delete newFormData[key];
                }
              }
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } // Call getDefaultFormState to make sure defaults are populated on change.


      onChange((0, _utils.getDefaultFormState)(options[selectedOption], newFormData, definitions));

      _this.setState({
        selectedOption: (0, _parseInt2["default"])(option, 10)
      });
    });
    var _this$props2 = _this.props,
        _formData = _this$props2.formData,
        _options = _this$props2.options;
    _this.state = {
      selectedOption: _this.getMatchingOption(_formData, _options)
    };
    return _this;
  }

  (0, _createClass2["default"])(AnyOfField, [{
    key: "componentWillReceiveProps",
    value: function componentWillReceiveProps(nextProps) {
      var matchingOption = this.getMatchingOption(nextProps.formData, nextProps.options);

      if (matchingOption === this.state.selectedOption) {
        return;
      }

      this.setState({
        selectedOption: matchingOption
      });
    }
  }, {
    key: "getMatchingOption",
    value: function getMatchingOption(formData, options) {
      var definitions = this.props.registry.definitions;
      var option = (0, _utils.getMatchingOption)(formData, options, definitions);

      if (option !== 0) {
        return option;
      } // If the form data matches none of the options, use the currently selected
      // option, assuming it's available; otherwise use the first option


      return this && this.state ? this.state.selectedOption : 0;
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props3 = this.props,
          baseType = _this$props3.baseType,
          disabled = _this$props3.disabled,
          errorSchema = _this$props3.errorSchema,
          formData = _this$props3.formData,
          taskData = _this$props3.taskData,
          idPrefix = _this$props3.idPrefix,
          idSchema = _this$props3.idSchema,
          onBlur = _this$props3.onBlur,
          onChange = _this$props3.onChange,
          onFocus = _this$props3.onFocus,
          options = _this$props3.options,
          registry = _this$props3.registry,
          safeRenderCompletion = _this$props3.safeRenderCompletion,
          uiSchema = _this$props3.uiSchema,
          permission = _this$props3.permission,
          updatedFields = _this$props3.updatedFields,
          updatedFieldClassName = _this$props3.updatedFieldClassName,
          isDataLoaded = _this$props3.isDataLoaded,
          AuthID = _this$props3.AuthID,
          EditorType = _this$props3.EditorType,
          TaskID = _this$props3.TaskID,
          timezone = _this$props3.timezone,
          subForms = _this$props3.subForms,
          roleId = _this$props3.roleId;
      var _SchemaField = registry.fields.SchemaField;
      var widgets = registry.widgets;
      var selectedOption = this.state.selectedOption;

      var _getUiOptions = (0, _utils.getUiOptions)(uiSchema),
          _getUiOptions$widget = _getUiOptions.widget,
          widget = _getUiOptions$widget === void 0 ? "select" : _getUiOptions$widget,
          uiOptions = (0, _objectWithoutProperties2["default"])(_getUiOptions, ["widget"]);

      var Widget = (0, _utils.getWidget)({
        type: "number"
      }, widget, widgets);
      var option = options[selectedOption] || null;
      var optionSchema;

      if (option) {
        // If the subschema doesn't declare a type, infer the type from the
        // parent schema
        optionSchema = option.type ? option : (0, _assign["default"])({}, option, {
          type: baseType
        });
      }

      var enumOptions = options.map(function (option, index) {
        return {
          label: option.title || "Option ".concat(index + 1),
          value: index
        };
      });
      return _react["default"].createElement("div", {
        className: "panel panel-default panel-body"
      }, _react["default"].createElement("div", {
        className: "form-group"
      }, _react["default"].createElement(Widget, (0, _extends2["default"])({
        id: "".concat(idSchema.$id, "_anyof_select"),
        schema: {
          type: "number",
          "default": 0
        },
        onChange: this.onOptionChange,
        onBlur: onBlur,
        onFocus: onFocus,
        value: selectedOption,
        options: {
          enumOptions: enumOptions
        }
      }, uiOptions))), option !== null && _react["default"].createElement(_SchemaField, {
        schema: optionSchema,
        uiSchema: uiSchema,
        permission: permission,
        updatedFields: updatedFields,
        updatedFieldClassName: updatedFieldClassName,
        isDataLoaded: isDataLoaded,
        AuthID: AuthID,
        EditorType: EditorType,
        TaskID: TaskID,
        timezone: timezone,
        subForms: subForms,
        roleId: roleId,
        errorSchema: errorSchema,
        idSchema: idSchema,
        idPrefix: idPrefix,
        taskData: taskData,
        formData: formData,
        onChange: onChange,
        onBlur: onBlur,
        onFocus: onFocus,
        registry: registry,
        safeRenderCompletion: safeRenderCompletion,
        disabled: disabled
      }));
    }
  }]);
  return AnyOfField;
}(_react.Component);

AnyOfField.defaultProps = {
  disabled: false,
  errorSchema: {},
  idSchema: {},
  uiSchema: {}
};

if (process.env.NODE_ENV !== "production") {
  AnyOfField.propTypes = {
    options: _propTypes["default"].arrayOf(_propTypes["default"].object).isRequired,
    baseType: _propTypes["default"].string,
    uiSchema: _propTypes["default"].object,
    idSchema: _propTypes["default"].object,
    formData: _propTypes["default"].any,
    errorSchema: _propTypes["default"].object,
    registry: types.registry.isRequired
  };
}

var _default = AnyOfField;
exports["default"] = _default;