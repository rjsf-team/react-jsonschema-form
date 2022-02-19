'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var core = require('@rjsf/core');
var React = _interopDefault(require('react'));
var button = require('primereact/button');
var api = require('primereact/api');
var cn = _interopDefault(require('clsx'));
var message = require('primereact/message');
var checkbox = require('primereact/checkbox');
var colorpicker = require('primereact/colorpicker');
var password = require('primereact/password');
var radiobutton = require('primereact/radiobutton');
var inputtext = require('primereact/inputtext');
var dropdown = require('primereact/dropdown');
var multiselect = require('primereact/multiselect');
var inputtextarea = require('primereact/inputtextarea');
var inputnumber = require('primereact/inputnumber');

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

var _excluded = ["icon", "className"];
var mappings = {
  remove: /*#__PURE__*/React.createElement("i", {
    className: api.PrimeIcons.TIMES
  }),
  plus: /*#__PURE__*/React.createElement("i", {
    className: api.PrimeIcons.PLUS
  }),
  "arrow-up": /*#__PURE__*/React.createElement("i", {
    className: api.PrimeIcons.ARROW_UP
  }),
  "arrow-down": /*#__PURE__*/React.createElement("i", {
    className: api.PrimeIcons.ARROW_DOWN
  })
};

var IconButton = function IconButton(props) {
  var icon = props.icon,
      otherProps = _objectWithoutPropertiesLoose(props, _excluded);

  return React.createElement(button.Button, Object.assign({}, otherProps, {
    type: "button",
    icon: mappings[icon],
    className: cn("p-button-outlined p-button-sm", props.className)
  }));
};

var isMultiSelect = core.utils.isMultiSelect,
    getDefaultRegistry = core.utils.getDefaultRegistry;

var ArrayFieldTemplate = function ArrayFieldTemplate(props) {
  var schema = props.schema,
      _props$registry = props.registry,
      registry = _props$registry === void 0 ? getDefaultRegistry() : _props$registry;

  if (isMultiSelect(schema, registry.rootSchema)) {
    return React.createElement(DefaultFixedArrayFieldTemplate, Object.assign({}, props));
  }

  return React.createElement(DefaultNormalArrayFieldTemplate, Object.assign({}, props));
};

var ArrayFieldTitle = function ArrayFieldTitle(_ref) {
  var TitleField = _ref.TitleField,
      idSchema = _ref.idSchema,
      title = _ref.title,
      required = _ref.required;

  if (!title) {
    return null;
  }

  var id = idSchema.$id + "__title";
  return React.createElement(TitleField, {
    id: id,
    title: title,
    required: required
  });
};

var ArrayFieldDescription = function ArrayFieldDescription(_ref2) {
  var DescriptionField = _ref2.DescriptionField,
      idSchema = _ref2.idSchema,
      description = _ref2.description;

  if (!description) {
    return null;
  }

  var id = idSchema.$id + "__description";
  return React.createElement(DescriptionField, {
    id: id,
    description: description
  });
}; // Used in the two templates


var DefaultArrayItem = function DefaultArrayItem(props) {
  var canMoveItems = props.hasMoveUp || props.hasMoveDown;
  return React.createElement("div", {
    key: props.key,
    className: "flex align-items-start gap-2 p-2 border border-round"
  }, React.createElement("div", {
    className: "flex-grow-1"
  }, props.children), React.createElement("div", null, props.hasToolbar && React.createElement("div", {
    className: "flex flex-row"
  }, canMoveItems && React.createElement(React.Fragment, null, React.createElement(IconButton, {
    icon: "arrow-up",
    className: "array-item-move-up",
    style: props.hasRemove ? {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0
    } : undefined,
    disabled: props.disabled || props.readonly || !props.hasMoveUp,
    onClick: props.onReorderClick(props.index, props.index - 1)
  }), React.createElement(IconButton, {
    icon: "arrow-down",
    style: _extends({
      borderLeft: 0,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0
    }, props.hasRemove ? {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0
    } : {}),
    disabled: props.disabled || props.readonly || !props.hasMoveDown,
    onClick: props.onReorderClick(props.index, props.index + 1)
  })), props.hasRemove && React.createElement(IconButton, {
    icon: "remove",
    style: canMoveItems ? {
      borderLeft: 0,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0
    } : undefined,
    disabled: props.disabled || props.readonly,
    onClick: props.onDropIndexClick(props.index)
  }))));
};

var DefaultFixedArrayFieldTemplate = function DefaultFixedArrayFieldTemplate(props) {
  return React.createElement("fieldset", {
    className: props.className
  }, React.createElement(ArrayFieldTitle, {
    key: "array-field-title-" + props.idSchema.$id,
    TitleField: props.TitleField,
    idSchema: props.idSchema,
    title: props.uiSchema["ui:title"] || props.title,
    required: props.required
  }), (props.uiSchema["ui:description"] || props.schema.description) && React.createElement("div", {
    className: "field-description",
    key: "field-description-" + props.idSchema.$id
  }, props.uiSchema["ui:description"] || props.schema.description), React.createElement("div", {
    className: "array-item-list flex flex-column gap-2",
    key: "array-item-list-" + props.idSchema.$id
  }, props.items && props.items.map(DefaultArrayItem)), props.canAdd && React.createElement(IconButton, {
    icon: "plus",
    className: "mt-3 mb-3 array-item-add",
    onClick: props.onAddClick,
    disabled: props.disabled || props.readonly
  }));
};

var DefaultNormalArrayFieldTemplate = function DefaultNormalArrayFieldTemplate(props) {
  return React.createElement(React.Fragment, null, React.createElement(ArrayFieldTitle, {
    key: "array-field-title-" + props.idSchema.$id,
    TitleField: props.TitleField,
    idSchema: props.idSchema,
    title: props.uiSchema["ui:title"] || props.title,
    required: props.required
  }), (props.uiSchema["ui:description"] || props.schema.description) && React.createElement(ArrayFieldDescription, {
    key: "array-field-description-" + props.idSchema.$id,
    DescriptionField: props.DescriptionField,
    idSchema: props.idSchema,
    description: props.uiSchema["ui:description"] || props.schema.description
  }), React.createElement("div", {
    key: "array-item-list-" + props.idSchema.$id,
    className: "flex flex-column gap-2"
  }, props.items && props.items.map(function (p) {
    return DefaultArrayItem(p);
  }), props.canAdd && React.createElement(IconButton, {
    icon: "plus",
    className: "mt-1 mb-3 array-item-add",
    onClick: props.onAddClick,
    disabled: props.disabled || props.readonly
  })));
};

var ErrorList = function ErrorList(_ref) {
  var errors = _ref.errors;
  return React.createElement(message.Message, {
    className: "mb-3",
    severity: "error",
    style: {
      whiteSpace: "pre-line"
    },
    content: errors.map(function (error) {
      return error.stack;
    }).join("\n")
  });
};

var DescriptionField = function DescriptionField(_ref) {
  var description = _ref.description;

  if (description) {
    return React.createElement("div", {
      className: "text-sm mt-1 mb-3"
    }, description);
  }

  return null;
};

var TitleField = function TitleField(_ref) {
  var title = _ref.title,
      uiSchema = _ref.uiSchema;
  return React.createElement("div", {
    className: "border-bottom-1 border-500 mb-2"
  }, React.createElement("h5", null, uiSchema && uiSchema["ui:title"] || title));
};

var Fields = {
  DescriptionField: DescriptionField,
  TitleField: TitleField
};

var FieldTemplate = function FieldTemplate(_ref) {
  var id = _ref.id,
      hidden = _ref.hidden,
      children = _ref.children,
      displayLabel = _ref.displayLabel,
      _ref$rawErrors = _ref.rawErrors,
      rawErrors = _ref$rawErrors === void 0 ? [] : _ref$rawErrors,
      rawHelp = _ref.rawHelp,
      rawDescription = _ref.rawDescription;

  if (hidden) {
    return React.createElement(React.Fragment, null, children);
  }

  return React.createElement("div", null, children, displayLabel && rawDescription && React.createElement("div", {
    className: cn("text-sm", rawErrors.length > 0 ? "text-color-danger" : "text-color-muted")
  }, rawDescription), rawErrors.length > 0 && React.createElement("ul", null, rawErrors.map(function (error) {
    return React.createElement("li", {
      key: error,
      className: "m-0 p-0"
    }, React.createElement("small", {
      className: "m-0 text-color-danger"
    }, error));
  })), rawHelp && React.createElement("div", {
    id: id,
    className: cn("text-sm", rawErrors.length > 0 ? "text-color-danger" : "text-color-muted")
  }, rawHelp));
};

var ObjectFieldTemplate = function ObjectFieldTemplate(_ref) {
  var DescriptionField = _ref.DescriptionField,
      description = _ref.description,
      TitleField = _ref.TitleField,
      title = _ref.title,
      properties = _ref.properties,
      required = _ref.required,
      uiSchema = _ref.uiSchema,
      idSchema = _ref.idSchema;
  return React.createElement(React.Fragment, null, (uiSchema["ui:title"] || title) && React.createElement(TitleField, {
    id: idSchema.$id + "-title",
    title: uiSchema["ui:title"] || title,
    required: required
  }), description && React.createElement(DescriptionField, {
    id: idSchema.$id + "-description",
    description: description
  }), React.createElement("div", {
    className: "flex flex-column gap-2"
  }, properties.map(function (element, index) {
    return React.createElement("div", {
      key: index,
      className: element.hidden ? "d-none" : undefined
    }, element.content);
  })));
};

var CheckboxWidget = function CheckboxWidget(props) {
  var id = props.id,
      value = props.value,
      required = props.required,
      disabled = props.disabled,
      readonly = props.readonly,
      label = props.label,
      schema = props.schema,
      onChange = props.onChange;

  var _onChange = function _onChange(_ref) {
    var checked = _ref.checked;
    return onChange(checked);
  };

  var desc = label || schema.description;
  return React.createElement("div", {
    className: "flex align-items-start"
  }, React.createElement(checkbox.Checkbox, {
    inputId: id,
    checked: typeof value === "undefined" ? false : value,
    required: required,
    disabled: disabled || readonly,
    onChange: _onChange
  }), React.createElement("label", {
    htmlFor: id,
    className: "ml-2"
  }, desc));
};

var selectValue = function selectValue(value, selected, all) {
  var at = all.indexOf(value);
  var updated = selected.slice(0, at).concat(value, selected.slice(at)); // As inserting values at predefined index positions doesn't work with empty
  // arrays, we need to reorder the updated selection to match the initial order

  return updated.sort(function (a, b) {
    return all.indexOf(a) > all.indexOf(b);
  });
};

var deselectValue = function deselectValue(value, selected) {
  return selected.filter(function (v) {
    return v !== value;
  });
};

var CheckboxesWidget = function CheckboxesWidget(_ref) {
  var schema = _ref.schema,
      label = _ref.label,
      id = _ref.id,
      disabled = _ref.disabled,
      options = _ref.options,
      value = _ref.value,
      readonly = _ref.readonly,
      required = _ref.required,
      onChange = _ref.onChange;
  var enumOptions = options.enumOptions,
      enumDisabled = options.enumDisabled,
      inline = options.inline;

  var _onChange = function _onChange(option) {
    return function (_ref2) {
      var checked = _ref2.checked;
      var all = enumOptions.map(function (_ref3) {
        var value = _ref3.value;
        return value;
      });

      if (checked) {
        onChange(selectValue(option.value, value, all));
      } else {
        onChange(deselectValue(option.value, value));
      }
    };
  };

  return React.createElement("div", null, React.createElement("label", {
    htmlFor: id
  }, label || schema.title), React.createElement("div", null, enumOptions.map(function (option, index) {
    var checked = Array.isArray(value) ? value.includes(option.value) : value === option.value;
    var itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
    return React.createElement("div", {
      key: index,
      className: cn(inline ? "inline-flex" : "flex", "align-items-start")
    }, React.createElement(checkbox.Checkbox, {
      inputId: id + "_" + index,
      checked: checked,
      required: required,
      disabled: disabled || itemDisabled || readonly,
      onChange: _onChange(option)
    }), React.createElement("label", {
      htmlFor: id + "_" + index,
      className: "ml-2"
    }, option.label));
  })));
};

var ColorWidget = function ColorWidget(_ref) {
  var id = _ref.id,
      label = _ref.label,
      value = _ref.value,
      disabled = _ref.disabled,
      required = _ref.required,
      readonly = _ref.readonly,
      options = _ref.options,
      onChange = _ref.onChange,
      onBlur = _ref.onBlur,
      onFocus = _ref.onFocus,
      schema = _ref.schema,
      _ref$rawErrors = _ref.rawErrors,
      rawErrors = _ref$rawErrors === void 0 ? [] : _ref$rawErrors,
      uiSchema = _ref.uiSchema;

  var _onChange = function _onChange(_ref2) {
    var value = _ref2.value;
    return onChange(value === "" ? options.emptyValue : value);
  };

  var _onBlur = function _onBlur(_ref3) {
    var value = _ref3.target.value;
    return onBlur(id, value);
  };

  var _onFocus = function _onFocus(_ref4) {
    var value = _ref4.target.value;
    return onFocus(id, value);
  };

  return React.createElement("div", null, React.createElement("label", {
    htmlFor: id,
    className: cn("block", rawErrors.length > 0 ? "text-color-danger" : undefined)
  }, uiSchema["ui:title"] || schema.title || label, (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null), React.createElement(colorpicker.ColorPicker, {
    inputId: id,
    value: value || "",
    disabled: disabled,
    required: required,
    readOnly: readonly,
    onChange: _onChange,
    onBlur: _onBlur,
    onFocus: _onFocus
  }));
};

var DateWidget = function DateWidget(props) {
  var registry = props.registry;
  var TextWidget = registry.widgets.TextWidget;
  return React.createElement(TextWidget, Object.assign({}, props, {
    type: "date"
  }));
};

var localToUTC = core.utils.localToUTC,
    utcToLocal = core.utils.utcToLocal;

var DateTimeWidget = function DateTimeWidget(props) {
  var registry = props.registry;
  var TextWidget = registry.widgets.TextWidget;
  var value = utcToLocal(props.value);

  var onChange = function onChange(value) {
    props.onChange(localToUTC(value));
  };

  return React.createElement(TextWidget, Object.assign({}, props, {
    type: "datetime-local",
    value: value,
    onChange: onChange
  }));
};

var EmailWidget = function EmailWidget(props) {
  var registry = props.registry;
  var TextWidget = registry.widgets.TextWidget;
  return React.createElement(TextWidget, Object.assign({}, props, {
    type: "email"
  }));
};

var PasswordWidget = function PasswordWidget(_ref) {
  var id = _ref.id,
      required = _ref.required,
      readonly = _ref.readonly,
      disabled = _ref.disabled,
      value = _ref.value,
      label = _ref.label,
      onFocus = _ref.onFocus,
      onBlur = _ref.onBlur,
      onChange = _ref.onChange,
      options = _ref.options,
      autofocus = _ref.autofocus,
      schema = _ref.schema,
      uiSchema = _ref.uiSchema,
      _ref$rawErrors = _ref.rawErrors,
      rawErrors = _ref$rawErrors === void 0 ? [] : _ref$rawErrors;

  var _onChange = function _onChange(_ref2) {
    var value = _ref2.target.value;
    return onChange(value === "" ? options.emptyValue : value);
  };

  var _onBlur = function _onBlur(_ref3) {
    var value = _ref3.target.value;
    return onBlur(id, value);
  };

  var _onFocus = function _onFocus(_ref4) {
    var value = _ref4.target.value;
    return onFocus(id, value);
  };

  return React.createElement("div", null, React.createElement("label", {
    htmlFor: id,
    className: cn("block", rawErrors.length > 0 ? "text-color-danger" : undefined)
  }, uiSchema["ui:title"] || schema.title || label, (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null), React.createElement(password.Password, {
    inputId: id,
    autoFocus: autofocus,
    className: rawErrors.length > 0 ? "p-invalid" : undefined,
    required: required,
    disabled: disabled,
    readOnly: readonly,
    value: value ? value : "",
    onChange: _onChange,
    onFocus: _onFocus,
    onBlur: _onBlur
  }));
};

var RadioWidget = function RadioWidget(_ref) {
  var id = _ref.id,
      schema = _ref.schema,
      options = _ref.options,
      value = _ref.value,
      required = _ref.required,
      disabled = _ref.disabled,
      readonly = _ref.readonly,
      label = _ref.label,
      onChange = _ref.onChange,
      uiSchema = _ref.uiSchema;
  var enumOptions = options.enumOptions,
      enumDisabled = options.enumDisabled;

  var _onChange = function _onChange(_ref2) {
    var value = _ref2.value;
    return onChange(schema.type == "boolean" ? value !== "false" : value);
  };

  var inline = Boolean(options && options.inline);
  return React.createElement("div", null, React.createElement("label", {
    htmlFor: id,
    className: "block"
  }, uiSchema["ui:title"] || schema.title || label, (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null), enumOptions.map(function (option, i) {
    var itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
    var checked = option.value == value;
    return React.createElement("div", {
      className: cn(inline ? "inline-flex" : "flex", "align-items-start")
    }, React.createElement(radiobutton.RadioButton, {
      inputId: option.id,
      key: i,
      name: id,
      disabled: disabled || itemDisabled || readonly,
      checked: checked,
      required: required,
      value: option.value,
      onChange: _onChange
    }), React.createElement("label", {
      htmlFor: option.id,
      className: "ml-2"
    }, option.label));
  }));
};

var rangeSpec = core.utils.rangeSpec;

var RangeWidget = function RangeWidget(_ref) {
  var value = _ref.value,
      readonly = _ref.readonly,
      disabled = _ref.disabled,
      onBlur = _ref.onBlur,
      onFocus = _ref.onFocus,
      options = _ref.options,
      schema = _ref.schema,
      onChange = _ref.onChange,
      required = _ref.required,
      label = _ref.label,
      id = _ref.id,
      uiSchema = _ref.uiSchema;

  var sliderProps = _extends({
    value: value,
    label: label,
    id: id
  }, rangeSpec(schema));

  var _onChange = function _onChange(_ref2) {
    var value = _ref2.target.value;
    return onChange(value === "" ? options.emptyValue : value);
  };

  var _onBlur = function _onBlur(_ref3) {
    var value = _ref3.target.value;
    return onBlur(id, value);
  };

  var _onFocus = function _onFocus(_ref4) {
    var value = _ref4.target.value;
    return onFocus(id, value);
  };

  return React.createElement("div", null, React.createElement("label", {
    htmlFor: id,
    className: "block"
  }, uiSchema["ui:title"] || schema.title || label, (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null), React.createElement(inputtext.InputText, Object.assign({
    type: "range",
    required: required,
    disabled: disabled,
    readOnly: readonly,
    onChange: _onChange,
    onBlur: _onBlur,
    onFocus: _onFocus
  }, sliderProps)), React.createElement("span", {
    className: "range-view"
  }, value));
};

var asNumber = core.utils.asNumber,
    guessType = core.utils.guessType;
var nums = /*#__PURE__*/new Set(["number", "integer"]);
/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */

var processValue = function processValue(schema, value) {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  var type = schema.type,
      items = schema.items;

  if (value === "") {
    return undefined;
  }

  if (type === "array" && items && nums.has(items.type)) {
    return value.map(asNumber);
  }

  if (type === "boolean") {
    return value === "true";
  }

  if (type === "number") {
    return asNumber(value);
  } // If type is undefined, but an enum is present, try and infer the type from
  // the enum values


  if (schema["enum"]) {
    if (schema["enum"].every(function (x) {
      return guessType(x) === "number";
    })) {
      return asNumber(value);
    }

    if (schema["enum"].every(function (x) {
      return guessType(x) === "boolean";
    })) {
      return value === "true";
    }
  }

  return value;
};

var SelectWidget = function SelectWidget(_ref) {
  var schema = _ref.schema,
      id = _ref.id,
      options = _ref.options,
      label = _ref.label,
      required = _ref.required,
      disabled = _ref.disabled,
      value = _ref.value,
      multiple = _ref.multiple,
      autofocus = _ref.autofocus,
      _onChange = _ref.onChange,
      onBlur = _ref.onBlur,
      onFocus = _ref.onFocus,
      placeholder = _ref.placeholder,
      _ref$rawErrors = _ref.rawErrors,
      rawErrors = _ref$rawErrors === void 0 ? [] : _ref$rawErrors;
  var enumOptions = options.enumOptions,
      enumDisabled = options.enumDisabled;
  var emptyValue = multiple ? [] : "";
  var optionsList = enumOptions.map(function (_ref2) {
    var label = _ref2.label,
        value = _ref2.value;
    var disabled = Array.isArray(enumDisabled) && enumDisabled.includes(value);
    return {
      label: label,
      value: value,
      disabled: disabled
    };
  });

  var getValue = function getValue(event) {
    if (multiple) {
      var _value = Array.isArray(event.value) ? event.value : [event.value];

      return _value.map(function (o) {
        return o.value;
      });
    }

    return event.value;
  };

  return React.createElement("div", {
    className: "mb-2"
  }, React.createElement("label", {
    htmlFor: id,
    className: cn("block", rawErrors.length > 0 ? "text-color-danger" : undefined)
  }, label || schema.title, (label || schema.title) && required ? "*" : null), multiple ? React.createElement(multiselect.MultiSelect, {
    id: id,
    value: typeof value === "undefined" ? emptyValue : value,
    options: optionsList,
    disabled: disabled,
    placeholder: placeholder,
    className: rawErrors.length > 0 ? "is-invalid" : "",
    onBlur: onBlur && function () {
      onBlur(id, processValue(schema, value));
    },
    onFocus: onFocus && function () {
      onFocus(id, processValue(schema, value));
    },
    onChange: function onChange(event) {
      _onChange(processValue(schema, getValue(event)));
    }
  }) : React.createElement(dropdown.Dropdown, {
    id: id,
    value: typeof value === "undefined" ? emptyValue : value,
    options: optionsList,
    required: required,
    disabled: disabled,
    autoFocus: autofocus,
    placeholder: placeholder,
    className: rawErrors.length > 0 ? "is-invalid" : "",
    onBlur: onBlur && function () {
      onBlur(id, processValue(schema, value));
    },
    onFocus: onFocus && function () {
      onFocus(id, processValue(schema, value));
    },
    onChange: function onChange(event) {
      _onChange(processValue(schema, getValue(event)));
    }
  }));
};

var TextareaWidget = function TextareaWidget(_ref) {
  var id = _ref.id,
      placeholder = _ref.placeholder,
      value = _ref.value,
      required = _ref.required,
      disabled = _ref.disabled,
      autofocus = _ref.autofocus,
      label = _ref.label,
      readonly = _ref.readonly,
      onBlur = _ref.onBlur,
      onFocus = _ref.onFocus,
      onChange = _ref.onChange,
      options = _ref.options,
      schema = _ref.schema,
      _ref$rawErrors = _ref.rawErrors,
      rawErrors = _ref$rawErrors === void 0 ? [] : _ref$rawErrors,
      uiSchema = _ref.uiSchema;

  var _onChange = function _onChange(_ref2) {
    var value = _ref2.target.value;
    return onChange(value === "" ? options.emptyValue : value);
  };

  var _onBlur = function _onBlur(_ref3) {
    var value = _ref3.target.value;
    return onBlur(id, value);
  };

  var _onFocus = function _onFocus(_ref4) {
    var value = _ref4.target.value;
    return onFocus(id, value);
  };

  return React.createElement(React.Fragment, null, React.createElement("label", {
    htmlFor: id,
    className: cn("block", rawErrors.length > 0 ? "text-color-danger" : undefined)
  }, uiSchema["ui:title"] || schema.title || label, (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null), React.createElement(inputtextarea.InputTextarea, {
    id: id,
    className: cn("w-full", rawErrors.length > 0 ? "p-invalid" : ""),
    placeholder: placeholder,
    disabled: disabled,
    readOnly: readonly,
    value: value,
    required: required,
    autoFocus: autofocus,
    rows: options.rows || 5,
    autoResize: true,
    onChange: _onChange,
    onBlur: _onBlur,
    onFocus: _onFocus
  }));
};

var TextWidget = function TextWidget(_ref) {
  var id = _ref.id,
      placeholder = _ref.placeholder,
      required = _ref.required,
      readonly = _ref.readonly,
      disabled = _ref.disabled,
      type = _ref.type,
      label = _ref.label,
      value = _ref.value,
      onChange = _ref.onChange,
      onBlur = _ref.onBlur,
      onFocus = _ref.onFocus,
      autofocus = _ref.autofocus,
      options = _ref.options,
      schema = _ref.schema,
      uiSchema = _ref.uiSchema,
      _ref$rawErrors = _ref.rawErrors,
      rawErrors = _ref$rawErrors === void 0 ? [] : _ref$rawErrors;

  var _onChange = function _onChange(_ref2) {
    var value = _ref2.target.value;
    return onChange(value === "" ? options.emptyValue : value);
  };

  var _onBlur = function _onBlur(_ref3) {
    var value = _ref3.target.value;
    return onBlur(id, value);
  };

  var _onFocus = function _onFocus(_ref4) {
    var value = _ref4.target.value;
    return onFocus(id, value);
  };

  var inputType = (type || schema.type) === "string" ? "text" : "" + (type || schema.type);
  return React.createElement("div", null, React.createElement("label", {
    htmlFor: id,
    className: cn("block", rawErrors.length > 0 ? "text-color-danger" : undefined)
  }, uiSchema["ui:title"] || schema.title || label, (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null), React.createElement(inputtext.InputText, {
    id: id,
    placeholder: placeholder,
    autoFocus: autofocus,
    required: required,
    disabled: disabled,
    readOnly: readonly,
    className: cn("w-full", rawErrors.length > 0 ? "p-invalid" : ""),
    list: schema.examples ? "examples_" + id : undefined,
    type: inputType,
    value: value || value === 0 ? value : "",
    onChange: _onChange,
    onBlur: _onBlur,
    onFocus: _onFocus
  }), schema.examples ? React.createElement("datalist", {
    id: "examples_" + id
  }, schema.examples.concat(schema["default"] ? [schema["default"]] : []).map(function (example) {
    return React.createElement("option", {
      key: example,
      value: example
    });
  })) : null);
};

var UpDownWidget = function UpDownWidget(_ref) {
  var id = _ref.id,
      required = _ref.required,
      readonly = _ref.readonly,
      disabled = _ref.disabled,
      label = _ref.label,
      value = _ref.value,
      onChange = _ref.onChange,
      onBlur = _ref.onBlur,
      onFocus = _ref.onFocus,
      autofocus = _ref.autofocus,
      schema = _ref.schema,
      uiSchema = _ref.uiSchema;

  var _onChange = function _onChange(_ref2) {
    var value = _ref2.value;
    return onChange(value);
  };

  var _onBlur = function _onBlur(_ref3) {
    var value = _ref3.target.value;
    return onBlur(id, value);
  };

  var _onFocus = function _onFocus(_ref4) {
    var value = _ref4.target.value;
    return onFocus(id, value);
  };

  return React.createElement("div", null, React.createElement("label", {
    htmlFor: id,
    className: "block"
  }, uiSchema["ui:title"] || schema.title || label, (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null), React.createElement(inputnumber.InputNumber, {
    id: id,
    autoFocus: autofocus,
    required: required,
    disabled: disabled,
    readOnly: readonly,
    value: value || value === 0 ? value : "",
    onChange: _onChange,
    onBlur: _onBlur,
    onFocus: _onFocus
  }));
};

var URLWidget = function URLWidget(props) {
  var registry = props.registry;
  var TextWidget = registry.widgets.TextWidget;
  return React.createElement(TextWidget, Object.assign({}, props, {
    type: "url"
  }));
};

var FileWidget = function FileWidget(props) {
  var registry = props.registry;
  var TextWidget = registry.widgets.TextWidget;
  return React.createElement(TextWidget, Object.assign({}, props, {
    type: "file"
  }));
};

var Widgets = {
  CheckboxWidget: CheckboxWidget,
  CheckboxesWidget: CheckboxesWidget,
  ColorWidget: ColorWidget,
  DateWidget: DateWidget,
  DateTimeWidget: DateTimeWidget,
  EmailWidget: EmailWidget,
  PasswordWidget: PasswordWidget,
  RadioWidget: RadioWidget,
  RangeWidget: RangeWidget,
  SelectWidget: SelectWidget,
  TextareaWidget: TextareaWidget,
  TextWidget: TextWidget,
  UpDownWidget: UpDownWidget,
  URLWidget: URLWidget,
  FileWidget: FileWidget
};

var getDefaultRegistry$1 = core.utils.getDefaultRegistry;

var _getDefaultRegistry = /*#__PURE__*/getDefaultRegistry$1(),
    fields = _getDefaultRegistry.fields,
    widgets = _getDefaultRegistry.widgets;

var DefaultChildren = /*#__PURE__*/React.createElement(button.Button, {
  type: "submit",
  label: "Submit"
});
var Theme = {
  children: DefaultChildren,
  ArrayFieldTemplate: ArrayFieldTemplate,
  fields: /*#__PURE__*/_extends({}, fields, Fields),
  FieldTemplate: FieldTemplate,
  ObjectFieldTemplate: ObjectFieldTemplate,
  ErrorList: ErrorList,
  widgets: /*#__PURE__*/_extends({}, widgets, Widgets)
};

var Form = /*#__PURE__*/core.withTheme(Theme);

exports.FieldTemplate = FieldTemplate;
exports.Fields = Fields;
exports.Form = Form;
exports.ObjectFieldTemplate = ObjectFieldTemplate;
exports.Theme = Theme;
exports.Widgets = Widgets;
exports.default = Form;
//# sourceMappingURL=primereact.cjs.development.js.map
