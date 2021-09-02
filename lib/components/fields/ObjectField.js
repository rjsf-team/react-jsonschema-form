"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs2/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty2 = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty2(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/define-property"));

var _defineProperties = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/define-properties"));

var _getOwnPropertyDescriptors = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-descriptors"));

var _getOwnPropertyDescriptor = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-descriptor"));

var _getOwnPropertySymbols = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-symbols"));

var _extends2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/extends"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/json/stringify"));

var _isArray = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/is-array"));

var _assign = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/assign"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/inherits"));

var _defineProperty3 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/keys"));

var _AddButton = _interopRequireDefault(require("../AddButton"));

var _react = _interopRequireWildcard(require("react"));

var types = _interopRequireWildcard(require("../../types"));

var _utils = require("../../utils");

function ownKeys(object, enumerableOnly) { var keys = (0, _keys["default"])(object); if (_getOwnPropertySymbols["default"]) { var symbols = (0, _getOwnPropertySymbols["default"])(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return (0, _getOwnPropertyDescriptor["default"])(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty3["default"])(target, key, source[key]); }); } else if (_getOwnPropertyDescriptors["default"]) { (0, _defineProperties["default"])(target, (0, _getOwnPropertyDescriptors["default"])(source)); } else { ownKeys(Object(source)).forEach(function (key) { (0, _defineProperty2["default"])(target, key, (0, _getOwnPropertyDescriptor["default"])(source, key)); }); } } return target; }

function DefaultObjectFieldTemplate(props) {
  var canExpand = function canExpand() {
    var formData = props.formData,
        schema = props.schema,
        uiSchema = props.uiSchema;

    if (!schema.additionalProperties) {
      return false;
    }

    var _getUiOptions = (0, _utils.getUiOptions)(uiSchema),
        expandable = _getUiOptions.expandable;

    if (expandable === false) {
      return expandable;
    } // if ui:options.expandable was not explicitly set to false, we can add
    // another property if we have not exceeded maxProperties yet


    if (schema.maxProperties !== undefined) {
      return (0, _keys["default"])(formData).length < schema.maxProperties;
    }

    return true;
  };

  var TitleField = props.TitleField,
      DescriptionField = props.DescriptionField;
  return _react["default"].createElement("fieldset", {
    id: props.idSchema.$id
  }, (props.uiSchema["ui:title"] || props.title) && _react["default"].createElement(TitleField, {
    id: "".concat(props.idSchema.$id, "__title"),
    title: props.title || props.uiSchema["ui:title"],
    required: props.required,
    formContext: props.formContext
  }), props.description && _react["default"].createElement(DescriptionField, {
    id: "".concat(props.idSchema.$id, "__description"),
    description: props.description,
    formContext: props.formContext
  }), props.properties.map(function (prop) {
    return prop.content;
  }), canExpand() && _react["default"].createElement(_AddButton["default"], {
    textValue: "+",
    typeValue: "secondary",
    className: "object-property-expand",
    onClick: props.onAddClick(props.schema),
    disabled: props.disabled || props.readonly
  }));
}

var ObjectField =
/*#__PURE__*/
function (_Component) {
  (0, _inherits2["default"])(ObjectField, _Component);

  function ObjectField() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2["default"])(this, ObjectField);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2["default"])(this, (_getPrototypeOf2 = (0, _getPrototypeOf3["default"])(ObjectField)).call.apply(_getPrototypeOf2, [this].concat(args)));
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "state", {
      wasPropertyKeyModified: false,
      additionalProperties: {}
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "onPropertyChange", function (name) {
      var addedByAdditionalProperties = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      return function (value, errorSchema) {
        if (!value && addedByAdditionalProperties) {
          // Don't set value = undefined for fields added by
          // additionalProperties. Doing so removes them from the
          // formData, which causes them to completely disappear
          // (including the input field for the property name). Unlike
          // fields which are "mandated" by the schema, these fields can
          // be set to undefined by clicking a "delete field" button, so
          // set empty values to the empty string.
          value = "";
        }

        var newFormData = _objectSpread({}, _this.props.formData, (0, _defineProperty3["default"])({}, name, value));

        _this.props.onChange(newFormData, errorSchema && _this.props.errorSchema && _objectSpread({}, _this.props.errorSchema, (0, _defineProperty3["default"])({}, name, errorSchema)));
      };
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "onDropPropertyClick", function (key) {
      return function (event) {
        event.preventDefault();
        var _this$props = _this.props,
            onChange = _this$props.onChange,
            formData = _this$props.formData;

        var copiedFormData = _objectSpread({}, formData);

        delete copiedFormData[key];
        onChange(copiedFormData);
      };
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "getAvailableKey", function (preferredKey, formData) {
      var index = 0;
      var newKey = preferredKey;

      while (formData.hasOwnProperty(newKey)) {
        newKey = "".concat(preferredKey, "-").concat(++index);
      }

      return newKey;
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "onKeyChange", function (oldValue) {
      return function (value, errorSchema) {
        if (oldValue === value) {
          return;
        }

        value = _this.getAvailableKey(value, _this.props.formData);

        var newFormData = _objectSpread({}, _this.props.formData);

        var newKeys = (0, _defineProperty3["default"])({}, oldValue, value);
        var keyValues = (0, _keys["default"])(newFormData).map(function (key) {
          var newKey = newKeys[key] || key;
          return (0, _defineProperty3["default"])({}, newKey, newFormData[key]);
        });

        var renamedObj = _assign["default"].apply(Object, [{}].concat((0, _toConsumableArray2["default"])(keyValues)));

        _this.setState({
          wasPropertyKeyModified: true
        });

        _this.props.onChange(renamedObj, errorSchema && _this.props.errorSchema && _objectSpread({}, _this.props.errorSchema, (0, _defineProperty3["default"])({}, value, errorSchema)));
      };
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "handleAddClick", function (schema) {
      return function () {
        var type = schema.additionalProperties.type;

        var newFormData = _objectSpread({}, _this.props.formData);

        if (schema.additionalProperties.hasOwnProperty("$ref")) {
          var _this$props$registry = _this.props.registry,
              registry = _this$props$registry === void 0 ? (0, _utils.getDefaultRegistry)() : _this$props$registry;
          var refSchema = (0, _utils.retrieveSchema)({
            $ref: schema.additionalProperties["$ref"]
          }, registry.definitions, _this.props.formData);
          type = refSchema.type;
        }

        newFormData[_this.getAvailableKey("newKey", newFormData)] = _this.getDefaultValue(type);

        _this.props.onChange(newFormData);
      };
    });
    return _this;
  }

  (0, _createClass2["default"])(ObjectField, [{
    key: "isRequired",
    value: function isRequired(name) {
      var schema = this.props.schema;
      return (0, _isArray["default"])(schema.required) && schema.required.indexOf(name) !== -1;
    }
  }, {
    key: "getDefaultValue",
    value: function getDefaultValue(type) {
      switch (type) {
        case "string":
          return "New Value";

        case "array":
          return [];

        case "boolean":
          return false;

        case "null":
          return null;

        case "number":
          return 0;

        case "object":
          return {};

        default:
          // We don't have a datatype for some reason (perhaps additionalProperties was true)
          return "New Value";
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$props2 = this.props,
          uiSchema = _this$props2.uiSchema,
          permission = _this$props2.permission,
          updatedFields = _this$props2.updatedFields,
          realtimeUserPositionField = _this$props2.realtimeUserPositionField,
          updatedFieldClassName = _this$props2.updatedFieldClassName,
          isDataLoaded = _this$props2.isDataLoaded,
          AuthID = _this$props2.AuthID,
          EditorType = _this$props2.EditorType,
          TaskID = _this$props2.TaskID,
          timezone = _this$props2.timezone,
          roleId = _this$props2.roleId,
          formData = _this$props2.formData,
          taskData = _this$props2.taskData,
          errorSchema = _this$props2.errorSchema,
          idSchema = _this$props2.idSchema,
          name = _this$props2.name,
          required = _this$props2.required,
          disabled = _this$props2.disabled,
          readonly = _this$props2.readonly,
          idPrefix = _this$props2.idPrefix,
          onBlur = _this$props2.onBlur,
          onFocus = _this$props2.onFocus,
          originalArrayData = _this$props2.originalArrayData,
          isEditTrigger = _this$props2.isEditTrigger,
          onOptionFilter = _this$props2.onOptionFilter,
          onOptionResponse = _this$props2.onOptionResponse,
          arrayLabelOnlyPermission = _this$props2.arrayLabelOnlyPermission,
          _this$props2$registry = _this$props2.registry,
          registry = _this$props2$registry === void 0 ? (0, _utils.getDefaultRegistry)() : _this$props2$registry,
          subForms = _this$props2.subForms;
      var definitions = registry.definitions,
          fields = registry.fields,
          formContext = registry.formContext;
      var SchemaField = fields.SchemaField,
          TitleField = fields.TitleField,
          DescriptionField = fields.DescriptionField;
      var schema = (0, _utils.retrieveSchema)(this.props.schema, definitions, formData); // If this schema has a title defined, but the user has set a new key/label, retain their input.

      var title;

      if (this.state.wasPropertyKeyModified) {
        title = name;
      } else {
        title = schema.title === undefined ? name : schema.title;
      }

      var description = uiSchema["ui:description"] || schema.description;
      var orderedProperties;

      try {
        var properties = (0, _keys["default"])(schema.properties || {});
        orderedProperties = (0, _utils.orderProperties)(properties, uiSchema["ui:order"]);
      } catch (err) {
        return _react["default"].createElement("div", null, _react["default"].createElement("p", {
          className: "config-error",
          style: {
            color: "red"
          }
        }, "Invalid ", name || "root", " object field configuration:", _react["default"].createElement("em", null, err.message), "."), _react["default"].createElement("pre", null, (0, _stringify["default"])(schema)));
      }

      var Template = uiSchema["ui:ObjectFieldTemplate"] || registry.ObjectFieldTemplate || DefaultObjectFieldTemplate;
      var templateProps = {
        title: uiSchema["ui:title"] || title,
        description: description,
        TitleField: TitleField,
        DescriptionField: DescriptionField,
        properties: orderedProperties.map(function (name) {
          var addedByAdditionalProperties = schema.properties[name].hasOwnProperty(_utils.ADDITIONAL_PROPERTY_FLAG);
          return {
            content: _react["default"].createElement(SchemaField, {
              key: name,
              name: name,
              required: _this2.isRequired(name),
              schema: schema.properties[name],
              permission: permission,
              updatedFields: updatedFields,
              realtimeUserPositionField: realtimeUserPositionField,
              updatedFieldClassName: updatedFieldClassName,
              isDataLoaded: isDataLoaded,
              AuthID: AuthID,
              EditorType: EditorType,
              TaskID: TaskID,
              timezone: timezone,
              subForms: subForms,
              roleId: roleId,
              uiSchema: addedByAdditionalProperties ? uiSchema.additionalProperties : uiSchema[name],
              originalArrayData: originalArrayData,
              isEditTrigger: isEditTrigger,
              arrayLabelOnlyPermission: arrayLabelOnlyPermission,
              errorSchema: errorSchema[name],
              idSchema: idSchema[name],
              idPrefix: idPrefix,
              taskData: taskData,
              formData: (formData || {})[name],
              wasPropertyKeyModified: _this2.state.wasPropertyKeyModified,
              onKeyChange: _this2.onKeyChange(name),
              onChange: _this2.onPropertyChange(name, addedByAdditionalProperties),
              onBlur: onBlur,
              onOptionFilter:
              /* onOptionFilter */
              onOptionFilter ? (onOptionFilter || null)[name] : undefined,
              onOptionResponse:
              /* onOptionResponse */
              onOptionResponse ? (onOptionResponse || null)[name] : undefined,
              onFocus: onFocus,
              registry: registry,
              disabled: disabled,
              readonly: readonly,
              onDropPropertyClick: _this2.onDropPropertyClick
            }),
            name: name,
            readonly: readonly,
            disabled: disabled,
            required: required
          };
        }),
        readonly: readonly,
        disabled: disabled,
        required: required,
        idSchema: idSchema,
        uiSchema: uiSchema,
        schema: schema,
        formData: formData,
        formContext: formContext
      };
      return _react["default"].createElement(Template, (0, _extends2["default"])({}, templateProps, {
        onAddClick: this.handleAddClick
      }));
    }
  }]);
  return ObjectField;
}(_react.Component);

(0, _defineProperty3["default"])(ObjectField, "defaultProps", {
  uiSchema: {},
  formData: {},
  errorSchema: {},
  idSchema: {},
  required: false,
  disabled: false,
  readonly: false
});

if (process.env.NODE_ENV !== "production") {
  ObjectField.propTypes = types.fieldProps;
}

var _default = ObjectField;
exports["default"] = _default;