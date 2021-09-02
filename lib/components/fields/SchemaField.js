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

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/inherits"));

var _defineProperty3 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _extends2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/objectWithoutProperties"));

var _parseInt2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/parse-int"));

var _values = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/values"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/keys"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _utils = require("../../utils");

var _IconButton = _interopRequireDefault(require("../IconButton"));

var _jsonLogicJs = _interopRequireDefault(require("json-logic-js"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _includes = _interopRequireDefault(require("core-js/library/fn/array/includes"));

var types = _interopRequireWildcard(require("../../types"));

var _UnsupportedField = _interopRequireDefault(require("./UnsupportedField"));

function ownKeys(object, enumerableOnly) { var keys = (0, _keys["default"])(object); if (_getOwnPropertySymbols["default"]) { var symbols = (0, _getOwnPropertySymbols["default"])(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return (0, _getOwnPropertyDescriptor["default"])(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty3["default"])(target, key, source[key]); }); } else if (_getOwnPropertyDescriptors["default"]) { (0, _defineProperties["default"])(target, (0, _getOwnPropertyDescriptors["default"])(source)); } else { ownKeys(Object(source)).forEach(function (key) { (0, _defineProperty2["default"])(target, key, (0, _getOwnPropertyDescriptor["default"])(source, key)); }); } } return target; }

var REQUIRED_FIELD_SYMBOL = "*";
var COMPONENT_TYPES = {
  array: "ArrayField",
  "boolean": "BooleanField",
  integer: "NumberField",
  number: "NumberField",
  object: "ObjectField",
  string: "StringField",
  "null": "NullField"
};

function getFieldComponent(schema, uiSchema, idSchema, fields) {
  var field = uiSchema["ui:field"];

  if (typeof field === "function" || (0, _typeof2["default"])(field) === "object") {
    return field;
  }

  if (typeof field === "string" && field in fields) {
    return fields[field];
  }

  var componentName = COMPONENT_TYPES[(0, _utils.getSchemaType)(schema)]; // If the type is not defined and the schema uses 'anyOf' or 'oneOf', don't
  // render a field and let the MultiSchemaField component handle the form display

  if (!componentName && (schema.anyOf || schema.oneOf)) {
    return function () {
      return null;
    };
  }

  return componentName in fields ? fields[componentName] : function () {
    return _react["default"].createElement(_UnsupportedField["default"], {
      schema: schema,
      idSchema: idSchema,
      reason: "Unknown field type ".concat(schema.type)
    });
  };
}

function Label(props) {
  var label = props.label,
      required = props.required,
      id = props.id,
      _realtimepositionField = props._realtimepositionField;

  if (!label) {
    return null;
  }

  var renderFocusUserAvatar = function renderFocusUserAvatar() {
    if (_realtimepositionField && (0, _keys["default"])(_realtimepositionField).length > 0) {
      var queryArr = [];
      (0, _keys["default"])(_realtimepositionField).map(function (key) {
        queryArr.push(_react["default"].createElement("div", {
          "class": "UserAvatar ml-1",
          style: {
            display: 'inline-flex'
          }
        }, _react["default"].createElement("div", {
          "class": "UserAvatar--inner",
          style: {
            lineHeight: '15px',
            textAlign: 'center',
            borderRadius: '100%',
            maxWidth: '15px',
            width: '15px',
            maxHeight: '15px',
            height: '15px'
          }
        }, _react["default"].createElement("img", {
          "class": "UserAvatar--img",
          title: _realtimepositionField[key].name,
          src: "//www.gravatar.com/avatar/".concat(_realtimepositionField[key].md5_email, "?d=identicon"),
          alt: "G.Balraj User3",
          style: {
            display: 'block',
            borderRadius: '100%',
            width: '15px',
            height: '15px'
          }
        }))));
      });
      return queryArr;
    }
  };

  return _react["default"].createElement("label", {
    className: "control-label",
    htmlFor: id
  }, label, required && _react["default"].createElement("span", {
    className: "required"
  }, REQUIRED_FIELD_SYMBOL), renderFocusUserAvatar());
}

function LabelInput(props) {
  var id = props.id,
      label = props.label,
      onChange = props.onChange;
  return _react["default"].createElement("input", {
    className: "form-control",
    type: "text",
    id: id,
    onBlur: function onBlur(event) {
      return onChange(event.target.value);
    },
    defaultValue: label
  });
}

function Help(props) {
  var help = props.help;

  if (!help) {
    return null;
  }

  if (typeof help === "string") {
    return _react["default"].createElement("p", {
      className: "help-block"
    }, help);
  }

  return _react["default"].createElement("div", {
    className: "help-block"
  }, help);
}

function ErrorList(props) {
  var _props$errors = props.errors,
      errors = _props$errors === void 0 ? [] : _props$errors;

  if (errors.length === 0) {
    return null;
  }

  return _react["default"].createElement("div", null, _react["default"].createElement("ul", {
    className: "error-detail bs-callout bs-callout-info list-unstyled ml-1 mt-1"
  }, errors.filter(function (elem) {
    return !!elem;
  }).map(function (error, index) {
    return _react["default"].createElement("li", {
      className: "text-danger",
      key: index
    }, error);
  })));
}

function DefaultTemplate(props) {
  var id = props.id,
      label = props.label,
      children = props.children,
      errors = props.errors,
      help = props.help,
      description = props.description,
      hidden = props.hidden,
      required = props.required,
      displayLabel = props.displayLabel,
      labelOnlyPermission = props.labelOnlyPermission,
      EditAndLabelOnlyPermission = props.EditAndLabelOnlyPermission,
      arrayLabelOnlyPermission = props.arrayLabelOnlyPermission,
      _realtimepositionField = props._realtimepositionField;

  if (hidden) {
    return _react["default"].createElement("div", {
      className: "hidden"
    }, children);
  }

  return _react["default"].createElement(WrapIfAdditional, props, !labelOnlyPermission && !EditAndLabelOnlyPermission && !arrayLabelOnlyPermission && _react["default"].createElement(_react["default"].Fragment, null, displayLabel && _react["default"].createElement(Label, {
    label: label,
    required: required,
    id: id,
    _realtimepositionField: _realtimepositionField
  }), displayLabel && description ? description : null, children, errors, help), (labelOnlyPermission || EditAndLabelOnlyPermission || arrayLabelOnlyPermission) && _react["default"].createElement("dl", null, displayLabel && _react["default"].createElement("dt", null, " ", label, " "), _react["default"].createElement("dd", null, children)));
}

if (process.env.NODE_ENV !== "production") {
  DefaultTemplate.propTypes = {
    id: _propTypes["default"].string,
    classNames: _propTypes["default"].string,
    _realtimepositionField: _propTypes["default"].any,
    label: _propTypes["default"].string,
    children: _propTypes["default"].node.isRequired,
    errors: _propTypes["default"].element,
    rawErrors: _propTypes["default"].arrayOf(_propTypes["default"].string),
    help: _propTypes["default"].element,
    rawHelp: _propTypes["default"].oneOfType([_propTypes["default"].string, _propTypes["default"].element]),
    description: _propTypes["default"].element,
    rawDescription: _propTypes["default"].oneOfType([_propTypes["default"].string, _propTypes["default"].element]),
    hidden: _propTypes["default"].bool,
    required: _propTypes["default"].bool,
    readonly: _propTypes["default"].bool,
    displayLabel: _propTypes["default"].bool,
    fields: _propTypes["default"].object,
    formContext: _propTypes["default"].object
  };
}

DefaultTemplate.defaultProps = {
  hidden: false,
  readonly: false,
  required: false,
  displayLabel: true
};

function WrapIfAdditional(props) {
  var id = props.id,
      classNames = props.classNames,
      disabled = props.disabled,
      label = props.label,
      onKeyChange = props.onKeyChange,
      onDropPropertyClick = props.onDropPropertyClick,
      readonly = props.readonly,
      required = props.required,
      schema = props.schema;
  var keyLabel = "".concat(label, " Key"); // i18n ?

  var additional = schema.hasOwnProperty(_utils.ADDITIONAL_PROPERTY_FLAG);

  if (!additional) {
    return _react["default"].createElement("div", {
      className: classNames
    }, props.children);
  }

  return _react["default"].createElement("div", {
    className: classNames
  }, _react["default"].createElement("div", {
    className: "row"
  }, _react["default"].createElement("div", {
    className: "col-xs-5 form-additional"
  }, _react["default"].createElement("div", {
    className: "form-group"
  }, _react["default"].createElement(Label, {
    label: keyLabel,
    required: required,
    id: "".concat(id, "-key")
  }), _react["default"].createElement(LabelInput, {
    label: label,
    required: required,
    id: "".concat(id, "-key"),
    onChange: onKeyChange
  }))), _react["default"].createElement("div", {
    className: "form-additional form-group col-xs-5"
  }, props.children), _react["default"].createElement("div", {
    className: "col-xs-2"
  }, _react["default"].createElement(_IconButton["default"], {
    type: "danger",
    icon: "remove",
    className: "array-item-remove btn-block",
    tabIndex: "-1",
    style: {
      border: "0"
    },
    disabled: disabled || readonly,
    onClick: onDropPropertyClick(label)
  }))));
}

function resolveObjectPathData(path, obj) {
  return path.split('.').reduce(function (prev, curr) {
    return prev ? prev[curr] : null;
  }, obj || self);
}

function SchemaFieldRender(props) {
  var uiSchema = props.uiSchema,
      permission = props.permission,
      isAuth = props.isAuth,
      formData = props.formData,
      taskData = props.taskData,
      errorSchema = props.errorSchema,
      idPrefix = props.idPrefix,
      name = props.name,
      onKeyChange = props.onKeyChange,
      onDropPropertyClick = props.onDropPropertyClick,
      required = props.required,
      originalArrayData = props.originalArrayData,
      _props$registry = props.registry,
      registry = _props$registry === void 0 ? (0, _utils.getDefaultRegistry)() : _props$registry,
      _props$wasPropertyKey = props.wasPropertyKeyModified,
      wasPropertyKeyModified = _props$wasPropertyKey === void 0 ? false : _props$wasPropertyKey,
      updatedFields = props.updatedFields,
      updatedFieldClassName = props.updatedFieldClassName,
      realtimeUserPositionField = props.realtimeUserPositionField,
      isDataLoaded = props.isDataLoaded,
      AuthID = props.AuthID,
      EditorType = props.EditorType,
      TaskID = props.TaskID,
      timezone = props.timezone,
      roleId = props.roleId,
      isEditTrigger = props.isEditTrigger,
      arrayLabelOnlyPermission = props.arrayLabelOnlyPermission,
      subForms = props.subForms;
  var definitions = registry.definitions,
      fields = registry.fields,
      formContext = registry.formContext;
  var FieldTemplate = uiSchema["ui:FieldTemplate"] || registry.FieldTemplate || DefaultTemplate;
  var idSchema = props.idSchema;
  var schema = (0, _utils.retrieveSchema)(props.schema, definitions, formData);
  idSchema = (0, _utils.mergeObjects)((0, _utils.toIdSchema)(schema, null, definitions, formData, idPrefix), idSchema); // Checking Role Based actions

  var readonlyPermission = false;
  var labelOnlyPermission = false;
  var EditAndLabelOnlyPermission = false;

  if (permission && permission[roleId]) {
    if (permission[roleId][0] !== undefined && (0, _includes["default"])((0, _values["default"])(permission[roleId][0]), name) && name) {
      return null;
    } else if (permission[roleId][1] !== undefined && (0, _includes["default"])((0, _values["default"])(permission[roleId][1]), name) && name && !originalArrayData) {
      labelOnlyPermission = true;
    } else if (permission[roleId][2] !== undefined && (0, _includes["default"])((0, _values["default"])(permission[roleId][2]), name) && name && !originalArrayData) {
      readonlyPermission = true;
    } else if (permission[roleId][4] !== undefined && (0, _includes["default"])((0, _values["default"])(permission[roleId][4]), name) && formData && name && originalArrayData) {
      if (originalArrayData['id'] !== undefined && originalArrayData['id'] != '-1') {
        labelOnlyPermission = true;
      }
    } else if (permission[roleId][6] !== undefined && (0, _includes["default"])((0, _values["default"])(permission[roleId][6]), name) && formData && name && originalArrayData && originalArrayData['user_id']) {
      if (originalArrayData['id'] !== undefined && originalArrayData['id'] != '-1' && (0, _parseInt2["default"])(originalArrayData['user_id']) !== (0, _parseInt2["default"])(AuthID)) {
        labelOnlyPermission = true;
      } else if (originalArrayData['id'] !== undefined && originalArrayData['id'] != '-1' && (0, _parseInt2["default"])(originalArrayData['user_id']) === (0, _parseInt2["default"])(AuthID)) {
        EditAndLabelOnlyPermission = true;
      }
    } else if (permission[roleId][7] !== undefined && (0, _includes["default"])((0, _values["default"])(permission[roleId][7]), name) && formData && name && originalArrayData && originalArrayData['user_id']) {
      EditAndLabelOnlyPermission = true;
    }
  }

  if (isAuth === false) {
    readonlyPermission = true;
  }

  if (taskData && uiSchema["ui:conditional"] && _jsonLogicJs["default"].apply(uiSchema["ui:conditional"], taskData) === false) {
    return null;
  }

  var FieldComponent = getFieldComponent(schema, uiSchema, idSchema, fields);
  var DescriptionField = fields.DescriptionField;
  var disabled = Boolean(props.disabled || uiSchema["ui:disabled"]);
  var readonly = Boolean(props.readonly || uiSchema["ui:readonly"] || props.schema.readOnly || schema.readOnly || readonlyPermission);
  var autofocus = Boolean(props.autofocus || uiSchema["ui:autofocus"]);

  if ((0, _keys["default"])(schema).length === 0) {
    return null;
  }

  var uiOptions = (0, _utils.getUiOptions)(uiSchema);
  var _uiOptions$label = uiOptions.label,
      displayLabel = _uiOptions$label === void 0 ? true : _uiOptions$label;

  if (schema.type === "array") {
    displayLabel = (0, _utils.isMultiSelect)(schema, definitions) || (0, _utils.isFilesArray)(schema, uiSchema, definitions);
  }

  if (schema.type === "object") {
    displayLabel = false;
  }

  if (schema.type === "boolean" && !uiSchema["ui:widget"]) {
    displayLabel = false;
  }

  var __errors = errorSchema.__errors,
      fieldErrorSchema = (0, _objectWithoutProperties2["default"])(errorSchema, ["__errors"]); // See #439: uiSchema: Don't pass consumed class names to child components

  var field = '';

  if (labelOnlyPermission && !arrayLabelOnlyPermission) {
    displayLabel = true;

    if (schema.type == "array" && formData && formData.length > 0) {
      if (uiSchema && (uiSchema["ui:ArrayFieldTemplate"] || uiSchema["ui:field"])) {
        var Template = uiSchema["ui:ArrayFieldTemplate"] || uiSchema["ui:field"];
        return _react["default"].createElement(Template, (0, _extends2["default"])({}, props, {
          labelonly: true
        }));
      } else {
        var tmpForData = [];
        formData.forEach(function (value) {
          if (uiSchema["ui:labelKey"] && uiSchema["ui:labelKey"] !== undefined) {
            var LabelValue = resolveObjectPathData(uiSchema["ui:labelKey"], value);
            tmpForData.push(LabelValue);
          } else {
            tmpForData.push(value);
          }
        });
        tmpForData = tmpForData.join(', ');
        field = _react["default"].createElement(_react["default"].Fragment, null, tmpForData);
      }
    } else if (uiSchema["ui:widget"] && typeof uiSchema["ui:widget"] === "function" || uiSchema["ui:field"] && typeof uiSchema["ui:field"] === "function") {
      var _Template = uiSchema["ui:field"] ? uiSchema["ui:field"] : uiSchema["ui:widget"];

      return _react["default"].createElement(_Template, (0, _extends2["default"])({}, props, {
        labelonly: true
      }));
    } else {
      field = _react["default"].createElement(_react["default"].Fragment, null, formData);
    }
  } else if ((schema.type === "number" || schema.type === "string") && arrayLabelOnlyPermission) {
    displayLabel = formData ? true : false;
    field = _react["default"].createElement(_react["default"].Fragment, null, formData);
  } else if (EditAndLabelOnlyPermission) {
    field = _react["default"].createElement(_react["default"].Fragment, null, !isEditTrigger && _react["default"].createElement(_react["default"].Fragment, null, formData), isEditTrigger && _react["default"].createElement("div", null, _react["default"].createElement(FieldComponent, (0, _extends2["default"])({}, props, {
      idSchema: idSchema,
      schema: schema,
      uiSchema: _objectSpread({}, uiSchema, {
        classNames: undefined
      }),
      permission: permission,
      isAuth: isAuth,
      isDataLoaded: isDataLoaded,
      AuthID: AuthID,
      EditorType: EditorType,
      TaskID: TaskID,
      timezone: timezone,
      subForms: subForms,
      roleId: roleId,
      isEditTrigger: isEditTrigger,
      arrayLabelOnlyPermission: arrayLabelOnlyPermission,
      disabled: disabled,
      readonly: readonly,
      autofocus: autofocus,
      errorSchema: fieldErrorSchema,
      formContext: formContext,
      rawErrors: __errors
    }))));
  } else {
    field = _react["default"].createElement(FieldComponent, (0, _extends2["default"])({}, props, {
      idSchema: idSchema,
      schema: schema,
      uiSchema: _objectSpread({}, uiSchema, {
        classNames: undefined
      }),
      permission: permission,
      isAuth: isAuth,
      isDataLoaded: isDataLoaded,
      AuthID: AuthID,
      EditorType: EditorType,
      TaskID: TaskID,
      timezone: timezone,
      subForms: subForms,
      roleId: roleId,
      isEditTrigger: isEditTrigger,
      arrayLabelOnlyPermission: arrayLabelOnlyPermission,
      disabled: disabled,
      readonly: readonly,
      autofocus: autofocus,
      errorSchema: fieldErrorSchema,
      formContext: formContext,
      rawErrors: __errors
    }));
  }

  var type = schema.type;
  var id = idSchema.$id; // If this schema has a title defined, but the user has set a new key/label, retain their input.

  var label;

  if (wasPropertyKeyModified) {
    label = name;
  } else {
    label = uiSchema["ui:title"] || props.schema.title || schema.title || name;
  }

  var description = uiSchema["ui:description"] || props.schema.description || schema.description;
  var errors = __errors;
  var help = uiSchema["ui:help"];
  var hidden = uiSchema["ui:widget"] === "hidden";
  var tmpClassName = "";
  var _realtimepositionField = {};

  if (updatedFields !== undefined && updatedFields.indexOf(name) !== -1) {
    tmpClassName = updatedFieldClassName;
  }

  if (realtimeUserPositionField !== undefined && (0, _keys["default"])(realtimeUserPositionField).length && realtimeUserPositionField[name]) {
    _realtimepositionField = realtimeUserPositionField[name];
  }

  var classNames = ["form-group", "field", "field-".concat(type), errors && errors.length > 0 ? "field-error has-error has-danger" : "", uiSchema.classNames, tmpClassName].join(" ").trim();
  var fieldProps = {
    description: _react["default"].createElement(DescriptionField, {
      id: id + "__description",
      description: description,
      formContext: formContext
    }),
    rawDescription: description,
    help: _react["default"].createElement(Help, {
      help: help
    }),
    rawHelp: typeof help === "string" ? help : undefined,
    errors: _react["default"].createElement(ErrorList, {
      errors: errors
    }),
    rawErrors: errors,
    id: id,
    label: label,
    hidden: hidden,
    onKeyChange: onKeyChange,
    onDropPropertyClick: onDropPropertyClick,
    required: required,
    disabled: disabled,
    readonly: readonly,
    displayLabel: displayLabel,
    classNames: classNames,
    formContext: formContext,
    fields: fields,
    schema: schema,
    uiSchema: uiSchema,
    permission: permission,
    isAuth: isAuth,
    isDataLoaded: isDataLoaded,
    AuthID: AuthID,
    EditorType: EditorType,
    TaskID: TaskID,
    timezone: timezone,
    roleId: roleId,
    labelOnlyPermission: labelOnlyPermission,
    EditAndLabelOnlyPermission: EditAndLabelOnlyPermission,
    arrayLabelOnlyPermission: arrayLabelOnlyPermission,
    formData: formData,
    subForms: subForms,
    _realtimepositionField: _realtimepositionField
  };
  var _AnyOfField = registry.fields.AnyOfField;
  var _OneOfField = registry.fields.OneOfField;
  return _react["default"].createElement(_react["default"].Fragment, null, _react["default"].createElement(FieldTemplate, fieldProps, field, schema.anyOf && !(0, _utils.isSelect)(schema) && _react["default"].createElement(_AnyOfField, {
    disabled: disabled,
    errorSchema: errorSchema,
    taskData: taskData,
    formData: formData,
    idPrefix: idPrefix,
    idSchema: idSchema,
    onBlur: props.onBlur,
    onOptionFilter: props.onOptionFilter,
    onChange: props.onChange,
    onFocus: props.onFocus,
    options: schema.anyOf,
    baseType: schema.type,
    registry: registry,
    safeRenderCompletion: props.safeRenderCompletion,
    schema: schema,
    uiSchema: uiSchema,
    permission: permission,
    isAuth: isAuth,
    isDataLoaded: isDataLoaded,
    AuthID: AuthID,
    EditorType: EditorType,
    TaskID: TaskID,
    timezone: timezone,
    subForms: subForms,
    roleId: roleId
  }), schema.oneOf && !(0, _utils.isSelect)(schema) && _react["default"].createElement(_OneOfField, {
    disabled: disabled,
    errorSchema: errorSchema,
    taskData: taskData,
    formData: formData,
    idPrefix: idPrefix,
    idSchema: idSchema,
    onBlur: props.onBlur,
    onOptionFilter: props.onOptionFilter,
    onOptionResponse: props.onOptionResponse,
    onChange: props.onChange,
    onFocus: props.onFocus,
    options: schema.oneOf,
    baseType: schema.type,
    registry: registry,
    safeRenderCompletion: props.safeRenderCompletion,
    schema: schema,
    uiSchema: uiSchema,
    permission: permission,
    isAuth: isAuth,
    isDataLoaded: isDataLoaded,
    AuthID: AuthID,
    EditorType: EditorType,
    TaskID: TaskID,
    timezone: timezone,
    subForms: subForms,
    roleId: roleId
  })));
}

var SchemaField =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2["default"])(SchemaField, _React$Component);

  function SchemaField() {
    (0, _classCallCheck2["default"])(this, SchemaField);
    return (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(SchemaField).apply(this, arguments));
  }

  (0, _createClass2["default"])(SchemaField, [{
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps, nextState) {
      // if schemas are equal idSchemas will be equal as well,
      // so it is not necessary to compare
      return !(0, _utils.deepEquals)(this.props, nextProps);
      /* return !deepEquals(
        { ...this.props, idSchema: undefined },
        { ...nextProps, idSchema: undefined }
      ); */
    }
  }, {
    key: "render",
    value: function render() {
      return SchemaFieldRender(this.props);
    }
  }]);
  return SchemaField;
}(_react["default"].Component);

SchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
  idSchema: {},
  disabled: false,
  readonly: false,
  autofocus: false
};

if (process.env.NODE_ENV !== "production") {
  SchemaField.propTypes = {
    schema: _propTypes["default"].object.isRequired,
    uiSchema: _propTypes["default"].object,
    idSchema: _propTypes["default"].object,
    formData: _propTypes["default"].any,
    errorSchema: _propTypes["default"].object,
    registry: types.registry.isRequired
  };
}

var _default = SchemaField;
exports["default"] = _default;