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

var _keys = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/keys"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/objectWithoutProperties"));

var _values = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/values"));

var _parseInt2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/parse-int"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/inherits"));

var _defineProperty3 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _isArray = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/is-array"));

var _AddButton = _interopRequireDefault(require("../AddButton"));

var _IconButton = _interopRequireDefault(require("../IconButton"));

var _Confirmation = _interopRequireDefault(require("../Confirmation"));

var _react = _interopRequireWildcard(require("react"));

var _reactLifecyclesCompat = require("react-lifecycles-compat");

var _includes = _interopRequireDefault(require("core-js/library/fn/array/includes"));

var types = _interopRequireWildcard(require("../../types"));

var _lodash = _interopRequireDefault(require("lodash.findindex"));

var _UnsupportedField = _interopRequireDefault(require("./UnsupportedField"));

var _utils = require("../../utils");

var _shortid = _interopRequireDefault(require("shortid"));

function ownKeys(object, enumerableOnly) { var keys = (0, _keys["default"])(object); if (_getOwnPropertySymbols["default"]) { var symbols = (0, _getOwnPropertySymbols["default"])(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return (0, _getOwnPropertyDescriptor["default"])(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty3["default"])(target, key, source[key]); }); } else if (_getOwnPropertyDescriptors["default"]) { (0, _defineProperties["default"])(target, (0, _getOwnPropertyDescriptors["default"])(source)); } else { ownKeys(Object(source)).forEach(function (key) { (0, _defineProperty2["default"])(target, key, (0, _getOwnPropertyDescriptor["default"])(source, key)); }); } } return target; }

function ArrayFieldTitle(_ref) {
  var TitleField = _ref.TitleField,
      idSchema = _ref.idSchema,
      title = _ref.title,
      required = _ref.required;

  if (!title) {
    return null;
  }

  var id = "".concat(idSchema.$id, "__title");
  return _react["default"].createElement(TitleField, {
    id: id,
    title: title,
    required: required
  });
}

function ArrayFieldDescription(_ref2) {
  var DescriptionField = _ref2.DescriptionField,
      idSchema = _ref2.idSchema,
      description = _ref2.description;

  if (!description) {
    return null;
  }

  var id = "".concat(idSchema.$id, "__description");
  return _react["default"].createElement(DescriptionField, {
    id: id,
    description: description
  });
} // Used in the two templates


function DefaultArrayItem(props) {
  var btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold"
  };
  return _react["default"].createElement("div", {
    key: props.key,
    className: props.className
  }, _react["default"].createElement("div", {
    className: "row"
  }, props.hasToolbar && _react["default"].createElement("div", {
    className: "col-12"
  }, _react["default"].createElement("div", {
    className: "array-item-toolbox float-right"
  }, _react["default"].createElement("div", {
    className: "btn-group",
    style: {
      display: "flex",
      justifyContent: "space-around"
    }
  }, (props.hasMoveUp || props.hasMoveDown) && _react["default"].createElement(_IconButton["default"], {
    icon: "arrow-up",
    className: "array-item-move-up",
    tabIndex: "-1",
    style: btnStyle,
    disabled: props.disabled || props.readonly || !props.hasMoveUp,
    onClick: props.onReorderClick(props.index, props.index - 1)
  }), (props.hasMoveUp || props.hasMoveDown) && _react["default"].createElement(_IconButton["default"], {
    icon: "arrow-down",
    className: "array-item-move-down",
    tabIndex: "-1",
    style: btnStyle,
    disabled: props.disabled || props.readonly || !props.hasMoveDown,
    onClick: props.onReorderClick(props.index, props.index + 1)
  }), props.hasEdit && _react["default"].createElement(_IconButton["default"], {
    type: "primary",
    icon: "edit",
    className: "array-item-edit btn-sm",
    tabIndex: "-1",
    style: btnStyle,
    disabled: props.disabled || props.readonly,
    onClick: props.onEditIndexClick(props.index)
  }), props.hasRemove && _react["default"].createElement(_Confirmation["default"], {
    variant: "outline-primary",
    disabled: props.disabled || props.readonly,
    headingText: "Are you sure to delete this items?",
    onConfirmation: props.onDropIndexClick(props.index),
    ButtonText: 'X',
    className: "array-item-remove"
  })))), _react["default"].createElement("div", {
    className:
    /* props.hasToolbar ? "col-9" :  */
    "col-12"
  }, props.children)));
}

function DefaultFixedArrayFieldTemplate(props) {
  return _react["default"].createElement("fieldset", {
    className: props.className,
    id: props.idSchema.$id
  }, _react["default"].createElement(ArrayFieldTitle, {
    key: "array-field-title-".concat(props.idSchema.$id),
    TitleField: props.TitleField,
    idSchema: props.idSchema,
    title: props.uiSchema["ui:title"] || props.title,
    required: props.required
  }), (props.uiSchema["ui:description"] || props.schema.description) && _react["default"].createElement("div", {
    className: "field-description",
    key: "field-description-".concat(props.idSchema.$id)
  }, props.uiSchema["ui:description"] || props.schema.description), _react["default"].createElement("div", {
    className: "row array-item-list",
    key: "array-item-list-".concat(props.idSchema.$id)
  }, props.items && props.items.map(DefaultArrayItem)), props.canAdd && _react["default"].createElement(_AddButton["default"], {
    textValue: "+",
    typeValue: "secondary",
    className: "array-item-add",
    onClick: props.onAddClick,
    disabled: props.disabled || props.readonly
  }));
}

function DefaultNormalArrayFieldTemplate(props) {
  var AddButtonText = "+";

  if (props.uiSchema && props.uiSchema["ui:ArrayAddText"]) {
    AddButtonText = props.uiSchema["ui:ArrayAddText"];
  }

  return _react["default"].createElement("fieldset", {
    className: props.className,
    id: props.idSchema.$id
  }, _react["default"].createElement(ArrayFieldTitle, {
    key: "array-field-title-".concat(props.idSchema.$id),
    TitleField: props.TitleField,
    idSchema: props.idSchema,
    title: props.uiSchema["ui:title"] || props.title,
    required: props.required
  }), (props.uiSchema["ui:description"] || props.schema.description) && _react["default"].createElement(ArrayFieldDescription, {
    key: "array-field-description-".concat(props.idSchema.$id),
    DescriptionField: props.DescriptionField,
    idSchema: props.idSchema,
    description: props.uiSchema["ui:description"] || props.schema.description
  }), _react["default"].createElement("div", {
    className: "row array-item-list",
    key: "array-item-list-".concat(props.idSchema.$id)
  }, props.items && props.items.map(function (p) {
    return DefaultArrayItem(p);
  })), props.canAdd && _react["default"].createElement(_AddButton["default"], {
    className: "array-item-add",
    textValue: AddButtonText,
    typeValue: "link",
    onClick: props.onAddClick,
    disabled: props.disabled || props.readonly
  }));
}

function generateRowId() {
  return _shortid["default"].generate();
}

function generateKeyedFormData(formData) {
  return !(0, _isArray["default"])(formData) ? [] : formData.map(function (item) {
    return {
      key: generateRowId(),
      isEditableArray: false,
      item: item
    };
  });
}

function keyedToPlainFormData(keyedFormData) {
  return keyedFormData.map(function (keyedItem) {
    return keyedItem.item;
  });
}

var ArrayField =
/*#__PURE__*/
function (_Component) {
  (0, _inherits2["default"])(ArrayField, _Component);

  function ArrayField(props) {
    var _this;

    (0, _classCallCheck2["default"])(this, ArrayField);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(ArrayField).call(this, props));
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "_getNewFormDataRow", function () {
      var _this$props = _this.props,
          schema = _this$props.schema,
          _this$props$registry = _this$props.registry,
          registry = _this$props$registry === void 0 ? (0, _utils.getDefaultRegistry)() : _this$props$registry;
      var definitions = registry.definitions;
      var itemSchema = schema.items;

      if ((0, _utils.isFixedItems)(schema) && (0, _utils.allowAdditionalItems)(schema)) {
        itemSchema = schema.additionalItems;
      }

      return (0, _utils.getDefaultFormState)(itemSchema, undefined, definitions);
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "onAddClick", function (event) {
      var newData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      if (event) {
        event.preventDefault();
      }

      var _this$props2 = _this.props,
          onChange = _this$props2.onChange,
          onBlur = _this$props2.onBlur;
      var newKeyedFormData = [];

      if (newData && (0, _isArray["default"])(newData)) {
        var newKeyedFormDataRow = newData.map(function (item, i) {
          return {
            key: generateRowId(),
            isEditableArray: false,
            item: !item ? _this._getNewFormDataRow() : item
          };
        });
        newKeyedFormData = [].concat((0, _toConsumableArray2["default"])(_this.state.keyedFormData), (0, _toConsumableArray2["default"])(newKeyedFormDataRow));
      } else {
        var _newKeyedFormDataRow = {
          key: generateRowId(),
          isEditableArray: false,
          item: !newData ? _this._getNewFormDataRow() : newData
        };
        newKeyedFormData = [].concat((0, _toConsumableArray2["default"])(_this.state.keyedFormData), [_newKeyedFormDataRow]);
      }

      _this.setState({
        keyedFormData: newKeyedFormData,
        updatedKeyedFormData: true
      }, function () {
        onChange(keyedToPlainFormData(newKeyedFormData));
        onBlur(keyedToPlainFormData(newKeyedFormData));
      });
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "onAddIndexClick", function (index) {
      return function (event) {
        if (event) {
          event.preventDefault();
        }

        var onChange = _this.props.onChange;
        var newKeyedFormDataRow = {
          key: generateRowId(),
          isEditableArray: false,
          item: _this._getNewFormDataRow()
        };
        var newKeyedFormData = (0, _toConsumableArray2["default"])(_this.state.keyedFormData);
        newKeyedFormData.splice(index, 0, newKeyedFormDataRow);

        _this.setState({
          keyedFormData: newKeyedFormData,
          updatedKeyedFormData: true
        }, function () {
          return onChange(keyedToPlainFormData(newKeyedFormData));
        });
      };
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "onDropIndexClick", function (index) {
      return function (event) {
        if (event) {
          event.preventDefault();
        }

        var _this$props3 = _this.props,
            onChange = _this$props3.onChange,
            onBlur = _this$props3.onBlur;
        var keyedFormData = _this.state.keyedFormData; // refs #195: revalidate to ensure properly reindexing errors

        var newErrorSchema;

        if (_this.props.errorSchema) {
          newErrorSchema = {};
          var errorSchema = _this.props.errorSchema;

          for (var i in errorSchema) {
            i = (0, _parseInt2["default"])(i);

            if (i < index) {
              newErrorSchema[i] = errorSchema[i];
            } else if (i > index) {
              newErrorSchema[i - 1] = errorSchema[i];
            }
          }
        }

        var newKeyedFormData = keyedFormData.filter(function (_, i) {
          return i !== index;
        });

        _this.setState({
          keyedFormData: newKeyedFormData,
          updatedKeyedFormData: true
        }, function () {
          onChange(keyedToPlainFormData(newKeyedFormData), newErrorSchema);
          onBlur(keyedToPlainFormData(newKeyedFormData), newErrorSchema);
        });
      };
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "onEditIndexClick", function (index) {
      return function (event) {
        if (event) {
          event.preventDefault();
        }

        var onChange = _this.props.onChange;
        var keyedFormData = _this.state.keyedFormData; // refs #195: revalidate to ensure properly reindexing errors

        var newErrorSchema;

        if (_this.props.errorSchema) {
          newErrorSchema = {};
          var errorSchema = _this.props.errorSchema;

          for (var i in errorSchema) {
            i = (0, _parseInt2["default"])(i);

            if (i < index) {
              newErrorSchema[i] = errorSchema[i];
            } else if (i > index) {
              newErrorSchema[i - 1] = errorSchema[i];
            }
          }
        }

        var newKeyedFormData = keyedFormData;
        newKeyedFormData[index].isEditableArray = !keyedFormData[index].isEditableArray;

        _this.setState({
          keyedFormData: newKeyedFormData,
          updatedKeyedFormData: true
        }, function () {
          return onChange(keyedToPlainFormData(newKeyedFormData), newErrorSchema);
        });
      };
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "onReorderClick", function (index, newIndex) {
      return function (event) {
        if (event) {
          event.preventDefault();
          event.target.blur();
        }

        var onChange = _this.props.onChange;
        var newErrorSchema;

        if (_this.props.errorSchema) {
          newErrorSchema = {};
          var errorSchema = _this.props.errorSchema;

          for (var i in errorSchema) {
            if (i == index) {
              newErrorSchema[newIndex] = errorSchema[index];
            } else if (i == newIndex) {
              newErrorSchema[index] = errorSchema[newIndex];
            } else {
              newErrorSchema[i] = errorSchema[i];
            }
          }
        }

        var keyedFormData = _this.state.keyedFormData;

        function reOrderArray() {
          // Copy item
          var _newKeyedFormData = keyedFormData.slice(); // Moves item from index to newIndex


          _newKeyedFormData.splice(index, 1);

          _newKeyedFormData.splice(newIndex, 0, keyedFormData[index]);

          return _newKeyedFormData;
        }

        var newKeyedFormData = reOrderArray();

        _this.setState({
          keyedFormData: newKeyedFormData
        }, function () {
          return onChange(keyedToPlainFormData(newKeyedFormData), newErrorSchema);
        });
      };
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "onChangeForIndex", function (index) {
      return function (value, errorSchema) {
        var _this$props4 = _this.props,
            formData = _this$props4.formData,
            onChange = _this$props4.onChange;
        var newFormData = formData.map(function (item, i) {
          // We need to treat undefined items as nulls to have validation.
          // See https://github.com/tdegrunt/jsonschema/issues/206
          var jsonValue = typeof value === "undefined" ? null : value;
          return index === i ? jsonValue : item;
        });
        onChange(newFormData, errorSchema && _this.props.errorSchema && _objectSpread({}, _this.props.errorSchema, (0, _defineProperty3["default"])({}, index, errorSchema)));
      };
    });
    (0, _defineProperty3["default"])((0, _assertThisInitialized2["default"])(_this), "onSelectChange", function (value) {
      _this.props.onChange(value);
    });
    var _formData = props.formData;

    var _keyedFormData = generateKeyedFormData(_formData);

    _this.state = {
      keyedFormData: _keyedFormData,
      updatedKeyedFormData: false
    };
    return _this;
  }

  (0, _createClass2["default"])(ArrayField, [{
    key: "isItemRequired",
    value: function isItemRequired(itemSchema) {
      if ((0, _isArray["default"])(itemSchema.type)) {
        // While we don't yet support composite/nullable jsonschema types, it's
        // future-proof to check for requirement against these.
        return !(0, _includes["default"])(itemSchema.type, "null");
      } // All non-null array item types are inherently required by design


      return itemSchema.type !== "null";
    }
  }, {
    key: "canAddItem",
    value: function canAddItem(formItems) {
      var _this$props5 = this.props,
          schema = _this$props5.schema,
          uiSchema = _this$props5.uiSchema,
          permission = _this$props5.permission,
          roleId = _this$props5.roleId,
          name = _this$props5.name;

      var _getUiOptions = (0, _utils.getUiOptions)(uiSchema),
          addable = _getUiOptions.addable;

      if (addable !== false) {
        // if ui:options.addable was not explicitly set to false, we can add
        // another item if we have not exceeded maxItems yet
        if (schema.maxItems !== undefined) {
          addable = formItems.length < schema.maxItems;
        } else {
          addable = true;
        }
      }

      if (permission && permission[roleId] && permission[roleId][5] !== undefined && (0, _includes["default"])((0, _values["default"])(permission[roleId][5]), name) && name) {
        addable = false;
      }

      return addable;
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props6 = this.props,
          schema = _this$props6.schema,
          uiSchema = _this$props6.uiSchema,
          idSchema = _this$props6.idSchema,
          _this$props6$registry = _this$props6.registry,
          registry = _this$props6$registry === void 0 ? (0, _utils.getDefaultRegistry)() : _this$props6$registry;
      var definitions = registry.definitions;

      if (!schema.hasOwnProperty("items")) {
        return _react["default"].createElement(_UnsupportedField["default"], {
          schema: schema,
          idSchema: idSchema,
          reason: "Missing items definition"
        });
      }

      if ((0, _utils.isFixedItems)(schema)) {
        return this.renderFixedArray();
      }

      if ((0, _utils.isFilesArray)(schema, uiSchema, definitions)) {
        return this.renderFiles();
      }

      if ((0, _utils.isMultiSelect)(schema, definitions)) {
        return this.renderMultiSelect();
      }

      return this.renderNormalArray();
    }
  }, {
    key: "renderNormalArray",
    value: function renderNormalArray() {
      var _this2 = this;

      var _this$props7 = this.props,
          schema = _this$props7.schema,
          uiSchema = _this$props7.uiSchema,
          formData = _this$props7.formData,
          errorSchema = _this$props7.errorSchema,
          idSchema = _this$props7.idSchema,
          name = _this$props7.name,
          required = _this$props7.required,
          disabled = _this$props7.disabled,
          readonly = _this$props7.readonly,
          autofocus = _this$props7.autofocus,
          _this$props7$registry = _this$props7.registry,
          registry = _this$props7$registry === void 0 ? (0, _utils.getDefaultRegistry)() : _this$props7$registry,
          onBlur = _this$props7.onBlur,
          onFocus = _this$props7.onFocus,
          idPrefix = _this$props7.idPrefix,
          rawErrors = _this$props7.rawErrors,
          permission = _this$props7.permission,
          updatedFields = _this$props7.updatedFields,
          updatedFieldClassName = _this$props7.updatedFieldClassName,
          isDataLoaded = _this$props7.isDataLoaded,
          AuthID = _this$props7.AuthID,
          EditorType = _this$props7.EditorType,
          TaskID = _this$props7.TaskID,
          timezone = _this$props7.timezone,
          subForms = _this$props7.subForms,
          roleId = _this$props7.roleId;
      var title = schema.title === undefined ? name : schema.title;
      var ArrayFieldTemplate = registry.ArrayFieldTemplate,
          definitions = registry.definitions,
          fields = registry.fields,
          formContext = registry.formContext;
      var TitleField = fields.TitleField,
          DescriptionField = fields.DescriptionField;
      var itemsSchema = (0, _utils.retrieveSchema)(schema.items, definitions);
      var arrayProps = {
        canAdd: this.canAddItem(formData),
        items: this.state.keyedFormData.map(function (keyedItem, index) {
          var key = keyedItem.key,
              item = keyedItem.item,
              isEditableArray = keyedItem.isEditableArray;
          var itemSchema = (0, _utils.retrieveSchema)(schema.items, definitions, item);
          var itemErrorSchema = errorSchema ? errorSchema[index] : undefined;
          var itemIdPrefix = idSchema.$id + "_" + index;
          var itemIdSchema = (0, _utils.toIdSchema)(itemSchema, itemIdPrefix, definitions, item, idPrefix);
          return _this2.renderArrayFieldItem({
            isEditableArray: isEditableArray,
            key: key,
            index: index,
            canMoveUp: index > 0,
            canMoveDown: index < formData.length - 1,
            itemSchema: itemSchema,
            itemIdSchema: itemIdSchema,
            itemErrorSchema: itemErrorSchema,
            itemData: item,
            itemUiSchema: uiSchema.items,
            autofocus: autofocus && index === 0,
            onBlur: onBlur,
            onFocus: onFocus,
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
            name: name
          });
        }),
        className: "field field-array field-array-of-".concat(itemsSchema.type),
        DescriptionField: DescriptionField,
        disabled: disabled,
        idSchema: idSchema,
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
        onAddClick: this.onAddClick,
        readonly: readonly,
        required: required,
        schema: schema,
        title: title,
        TitleField: TitleField,
        formContext: formContext,
        formData: formData,
        rawErrors: rawErrors,
        registry: registry,
        onDropIndexClick: this.onDropIndexClick
      }; // Check if a custom render function was passed in

      var Component = uiSchema["ui:ArrayFieldTemplate"] || ArrayFieldTemplate || DefaultNormalArrayFieldTemplate;
      return _react["default"].createElement(Component, arrayProps);
    }
  }, {
    key: "renderMultiSelect",
    value: function renderMultiSelect() {
      var _this$props8 = this.props,
          schema = _this$props8.schema,
          idSchema = _this$props8.idSchema,
          uiSchema = _this$props8.uiSchema,
          formData = _this$props8.formData,
          taskData = _this$props8.taskData,
          disabled = _this$props8.disabled,
          readonly = _this$props8.readonly,
          required = _this$props8.required,
          label = _this$props8.label,
          placeholder = _this$props8.placeholder,
          autofocus = _this$props8.autofocus,
          onBlur = _this$props8.onBlur,
          onFocus = _this$props8.onFocus,
          _this$props8$registry = _this$props8.registry,
          registry = _this$props8$registry === void 0 ? (0, _utils.getDefaultRegistry)() : _this$props8$registry,
          rawErrors = _this$props8.rawErrors,
          permission = _this$props8.permission,
          updatedFields = _this$props8.updatedFields,
          updatedFieldClassName = _this$props8.updatedFieldClassName,
          isDataLoaded = _this$props8.isDataLoaded,
          AuthID = _this$props8.AuthID,
          EditorType = _this$props8.EditorType,
          TaskID = _this$props8.TaskID,
          timezone = _this$props8.timezone,
          subForms = _this$props8.subForms,
          roleId = _this$props8.roleId;
      var items = this.props.formData;
      var widgets = registry.widgets,
          definitions = registry.definitions,
          formContext = registry.formContext;
      var itemsSchema = (0, _utils.retrieveSchema)(schema.items, definitions, formData);
      var enumOptions = (0, _utils.optionsList)(itemsSchema);

      var _getUiOptions$enumOpt = _objectSpread({}, (0, _utils.getUiOptions)(uiSchema), {
        enumOptions: enumOptions
      }),
          _getUiOptions$enumOpt2 = _getUiOptions$enumOpt.widget,
          widget = _getUiOptions$enumOpt2 === void 0 ? "select" : _getUiOptions$enumOpt2,
          options = (0, _objectWithoutProperties2["default"])(_getUiOptions$enumOpt, ["widget"]);

      var Widget = (0, _utils.getWidget)(schema, widget, widgets);
      return _react["default"].createElement(Widget, {
        id: idSchema && idSchema.$id,
        multiple: true,
        onChange: this.onSelectChange,
        onBlur: onBlur,
        onFocus: onFocus,
        options: options,
        schema: schema,
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
        registry: registry,
        taskData: taskData,
        value: items,
        disabled: disabled,
        readonly: readonly,
        required: required,
        label: label,
        placeholder: placeholder,
        formContext: formContext,
        autofocus: autofocus,
        rawErrors: rawErrors
      });
    }
  }, {
    key: "renderFiles",
    value: function renderFiles() {
      var _this$props9 = this.props,
          schema = _this$props9.schema,
          uiSchema = _this$props9.uiSchema,
          idSchema = _this$props9.idSchema,
          name = _this$props9.name,
          disabled = _this$props9.disabled,
          readonly = _this$props9.readonly,
          autofocus = _this$props9.autofocus,
          onBlur = _this$props9.onBlur,
          onFocus = _this$props9.onFocus,
          _this$props9$registry = _this$props9.registry,
          registry = _this$props9$registry === void 0 ? (0, _utils.getDefaultRegistry)() : _this$props9$registry,
          rawErrors = _this$props9.rawErrors,
          permission = _this$props9.permission,
          taskData = _this$props9.taskData,
          updatedFields = _this$props9.updatedFields,
          updatedFieldClassName = _this$props9.updatedFieldClassName,
          isDataLoaded = _this$props9.isDataLoaded,
          AuthID = _this$props9.AuthID,
          EditorType = _this$props9.EditorType,
          TaskID = _this$props9.TaskID,
          timezone = _this$props9.timezone,
          roleId = _this$props9.roleId,
          subForms = _this$props9.subForms;
      var title = schema.title || name;
      var items = this.props.formData;
      var widgets = registry.widgets,
          formContext = registry.formContext;

      var _getUiOptions2 = (0, _utils.getUiOptions)(uiSchema),
          _getUiOptions2$widget = _getUiOptions2.widget,
          widget = _getUiOptions2$widget === void 0 ? "files" : _getUiOptions2$widget,
          options = (0, _objectWithoutProperties2["default"])(_getUiOptions2, ["widget"]);

      var Widget = (0, _utils.getWidget)(schema, widget, widgets);
      return _react["default"].createElement(Widget, {
        options: options,
        id: idSchema && idSchema.$id,
        multiple: true,
        onChange: this.onSelectChange,
        onBlur: onBlur,
        onFocus: onFocus,
        schema: schema,
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
        title: title,
        taskData: taskData,
        value: items,
        disabled: disabled,
        readonly: readonly,
        formContext: formContext,
        autofocus: autofocus,
        rawErrors: rawErrors
      });
    }
  }, {
    key: "renderFixedArray",
    value: function renderFixedArray() {
      var _this3 = this;

      var _this$props10 = this.props,
          schema = _this$props10.schema,
          uiSchema = _this$props10.uiSchema,
          formData = _this$props10.formData,
          errorSchema = _this$props10.errorSchema,
          idPrefix = _this$props10.idPrefix,
          idSchema = _this$props10.idSchema,
          name = _this$props10.name,
          required = _this$props10.required,
          disabled = _this$props10.disabled,
          readonly = _this$props10.readonly,
          autofocus = _this$props10.autofocus,
          _this$props10$registr = _this$props10.registry,
          registry = _this$props10$registr === void 0 ? (0, _utils.getDefaultRegistry)() : _this$props10$registr,
          onBlur = _this$props10.onBlur,
          onFocus = _this$props10.onFocus,
          rawErrors = _this$props10.rawErrors,
          permission = _this$props10.permission,
          updatedFields = _this$props10.updatedFields,
          updatedFieldClassName = _this$props10.updatedFieldClassName,
          isDataLoaded = _this$props10.isDataLoaded,
          AuthID = _this$props10.AuthID,
          EditorType = _this$props10.EditorType,
          TaskID = _this$props10.TaskID,
          timezone = _this$props10.timezone,
          roleId = _this$props10.roleId,
          subForms = _this$props10.subForms;
      var title = schema.title || name;
      var items = this.props.formData;
      var ArrayFieldTemplate = registry.ArrayFieldTemplate,
          definitions = registry.definitions,
          fields = registry.fields,
          formContext = registry.formContext;
      var TitleField = fields.TitleField;
      var itemSchemas = schema.items.map(function (item, index) {
        return (0, _utils.retrieveSchema)(item, definitions, formData[index]);
      });
      var additionalSchema = (0, _utils.allowAdditionalItems)(schema) ? (0, _utils.retrieveSchema)(schema.additionalItems, definitions, formData) : null;

      if (!items || items.length < itemSchemas.length) {
        // to make sure at least all fixed items are generated
        items = items || [];
        items = items.concat(new Array(itemSchemas.length - items.length));
      } // These are the props passed into the render function


      var arrayProps = {
        canAdd: this.canAddItem(items) && additionalSchema,
        className: "field field-array field-array-fixed-items",
        disabled: disabled,
        idSchema: idSchema,
        formData: formData,
        items: this.state.keyedFormData.map(function (keyedItem, index) {
          var key = keyedItem.key,
              item = keyedItem.item,
              isEditableArray = keyedItem.isEditableArray;
          var additional = index >= itemSchemas.length;
          var itemSchema = additional ? (0, _utils.retrieveSchema)(schema.additionalItems, definitions, item) : itemSchemas[index];
          var itemIdPrefix = idSchema.$id + "_" + index;
          var itemIdSchema = (0, _utils.toIdSchema)(itemSchema, itemIdPrefix, definitions, item, idPrefix);
          var itemUiSchema = additional ? uiSchema.additionalItems || {} : (0, _isArray["default"])(uiSchema.items) ? uiSchema.items[index] : uiSchema.items || {};
          var itemErrorSchema = errorSchema ? errorSchema[index] : undefined;
          return _this3.renderArrayFieldItem({
            isEditableArray: isEditableArray,
            key: key,
            index: index,
            canRemove: additional,
            canMoveUp: index >= itemSchemas.length + 1,
            canMoveDown: additional && index < items.length - 1,
            itemSchema: itemSchema,
            itemData: item,
            itemUiSchema: itemUiSchema,
            itemIdSchema: itemIdSchema,
            itemErrorSchema: itemErrorSchema,
            autofocus: autofocus && index === 0,
            onBlur: onBlur,
            onFocus: onFocus,
            permission: permission,
            updatedFields: updatedFields,
            updatedFieldClassName: updatedFieldClassName,
            isDataLoaded: isDataLoaded,
            AuthID: AuthID,
            EditorType: EditorType,
            TaskID: TaskID,
            timezone: timezone,
            roleId: roleId,
            subForms: subForms
          });
        }),
        onAddClick: this.onAddClick,
        readonly: readonly,
        required: required,
        schema: schema,
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
        title: title,
        TitleField: TitleField,
        formContext: formContext,
        rawErrors: rawErrors,
        onDropIndexClick: this.onDropIndexClick
      }; // Check if a custom template template was passed in

      var Template = uiSchema["ui:ArrayFieldTemplate"] || ArrayFieldTemplate || DefaultFixedArrayFieldTemplate;
      return _react["default"].createElement(Template, arrayProps);
    }
  }, {
    key: "renderArrayFieldItem",
    value: function renderArrayFieldItem(props) {
      var isEditableArray = props.isEditableArray,
          key = props.key,
          index = props.index,
          _props$canRemove = props.canRemove,
          canRemove = _props$canRemove === void 0 ? true : _props$canRemove,
          _props$canMoveUp = props.canMoveUp,
          canMoveUp = _props$canMoveUp === void 0 ? true : _props$canMoveUp,
          _props$CanEdit = props.CanEdit,
          CanEdit = _props$CanEdit === void 0 ? false : _props$CanEdit,
          _props$canMoveDown = props.canMoveDown,
          canMoveDown = _props$canMoveDown === void 0 ? true : _props$canMoveDown,
          itemSchema = props.itemSchema,
          itemData = props.itemData,
          itemUiSchema = props.itemUiSchema,
          itemIdSchema = props.itemIdSchema,
          itemErrorSchema = props.itemErrorSchema,
          permission = props.permission,
          taskData = props.taskData,
          updatedFields = props.updatedFields,
          updatedFieldClassName = props.updatedFieldClassName,
          isDataLoaded = props.isDataLoaded,
          AuthID = props.AuthID,
          EditorType = props.EditorType,
          TaskID = props.TaskID,
          timezone = props.timezone,
          subForms = props.subForms,
          roleId = props.roleId,
          autofocus = props.autofocus,
          onBlur = props.onBlur,
          onFocus = props.onFocus,
          rawErrors = props.rawErrors,
          name = props.name;
      var _this$props11 = this.props,
          disabled = _this$props11.disabled,
          readonly = _this$props11.readonly,
          uiSchema = _this$props11.uiSchema,
          _this$props11$registr = _this$props11.registry,
          registry = _this$props11$registr === void 0 ? (0, _utils.getDefaultRegistry)() : _this$props11$registr;
      var SchemaField = registry.fields.SchemaField;

      var _Editable$orderable$r = _objectSpread({
        Editable: true,
        orderable: true,
        removable: true
      }, uiSchema["ui:options"]),
          orderable = _Editable$orderable$r.orderable,
          removable = _Editable$orderable$r.removable,
          Editable = _Editable$orderable$r.Editable;

      var has = {
        moveUp: orderable && canMoveUp,
        moveDown: orderable && canMoveDown,
        remove: removable && canRemove,
        edit: Editable && CanEdit
      };
      has.toolbar = (0, _keys["default"])(has).some(function (key) {
        return has[key];
      });
      var arrayLabelOnlyPermission = false; // Checking Edit and Remove option showing based on Auth

      if (itemData && AuthID && itemData['id'] !== undefined && itemData['id'] !== '-1' && itemData['user_id'] !== '-1' && permission && permission[roleId] && permission[roleId][6] !== undefined && (0, _includes["default"])((0, _values["default"])(permission[roleId][6]), name) && name) {
        has.remove = false;
        has.edit = false;

        if ((0, _parseInt2["default"])(AuthID) === (0, _parseInt2["default"])(itemData['user_id'])) {
          has.remove = true;
          has.edit = true;
        }

        if (!isEditableArray) {
          arrayLabelOnlyPermission = true;
        }
      } else if (permission && permission[roleId] && permission[roleId][7] !== undefined && itemData && AuthID && itemData['id'] !== undefined && itemData['id'] !== '-1') {
        has.remove = true;
        has.edit = true;
      } else if (permission && permission[roleId] && permission[roleId][5] !== undefined && (0, _includes["default"])((0, _values["default"])(permission[roleId][5]), name) && name) {
        arrayLabelOnlyPermission = true;
        has.remove = false;
        has.edit = false;
        has.moveDown = false;
        has.moveUp = false;
      }

      return {
        children: _react["default"].createElement(SchemaField, {
          schema: itemSchema,
          uiSchema: itemUiSchema,
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
          isEditTrigger: isEditableArray,
          arrayLabelOnlyPermission: arrayLabelOnlyPermission,
          taskData: taskData,
          formData: itemData,
          originalArrayData: itemData,
          errorSchema: itemErrorSchema,
          idSchema: itemIdSchema,
          required: this.isItemRequired(itemSchema),
          onChange: this.onChangeForIndex(index),
          onBlur: onBlur,
          onFocus: onFocus,
          registry: this.props.registry,
          disabled: this.props.disabled,
          readonly: this.props.readonly,
          autofocus: autofocus,
          rawErrors: rawErrors
        }),
        className: "col-12",
        disabled: disabled,
        hasToolbar: has.toolbar,
        hasMoveUp: has.moveUp,
        hasMoveDown: has.moveDown,
        hasRemove: has.remove,
        hasEdit: has.edit,
        index: index,
        key: key,
        onAddIndexClick: this.onAddIndexClick,
        onDropIndexClick: this.onDropIndexClick,
        onEditIndexClick: this.onEditIndexClick,
        onReorderClick: this.onReorderClick,
        readonly: readonly
      };
    }
  }, {
    key: "itemTitle",
    get: function get() {
      var schema = this.props.schema;
      return schema.items.title || schema.items.description || "Item";
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(nextProps, prevState) {
      // Don't call getDerivedStateFromProps if keyed formdata was just updated.
      if (prevState.updatedKeyedFormData) {
        return {
          updatedKeyedFormData: false
        };
      }

      var nextFormData = nextProps.formData;
      var previousKeyedFormData = prevState.keyedFormData;
      var newKeyedFormData = nextFormData.length === previousKeyedFormData.length ? previousKeyedFormData.map(function (previousKeyedFormDatum, index) {
        return {
          key: previousKeyedFormDatum.key,
          isEditableArray: previousKeyedFormDatum.isEditableArray,
          item: nextFormData[index]
        };
      }) : generateKeyedFormData(nextFormData);
      return {
        keyedFormData: newKeyedFormData
      };
    }
  }]);
  return ArrayField;
}(_react.Component);

(0, _defineProperty3["default"])(ArrayField, "defaultProps", {
  uiSchema: {},
  formData: [],
  idSchema: {},
  required: false,
  disabled: false,
  readonly: false,
  isEditTrigger: false,
  autofocus: false
});

if (process.env.NODE_ENV !== "production") {
  ArrayField.propTypes = types.fieldProps;
}

(0, _reactLifecyclesCompat.polyfill)(ArrayField);
var _default = ArrayField;
exports["default"] = _default;