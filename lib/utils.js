"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.getDefaultRegistry = getDefaultRegistry;
exports.defaultFieldValue = defaultFieldValue;
exports.getWidget = getWidget;
exports.getDefaultFormState = getDefaultFormState;
exports.getUiOptions = getUiOptions;
exports.isObject = isObject;
exports.mergeObjects = mergeObjects;
exports.asNumber = asNumber;
exports.orderProperties = orderProperties;
exports.isMultiSelect = isMultiSelect;
exports.isFilesArray = isFilesArray;
exports.isFixedItems = isFixedItems;
exports.allowAdditionalItems = allowAdditionalItems;
exports.optionsList = optionsList;
exports.retrieveSchema = retrieveSchema;
exports.deepEquals = deepEquals;
exports.shouldRender = shouldRender;
exports.toIdSchema = toIdSchema;
exports.parseDateString = parseDateString;
exports.toDateString = toDateString;
exports.pad = pad;
exports.setState = setState;
exports.dataURItoBlob = dataURItoBlob;
exports.rangeSpec = rangeSpec;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

require("setimmediate");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var widgetMap = {
  boolean: {
    checkbox: "CheckboxWidget",
    radio: "RadioWidget",
    select: "SelectWidget",
    hidden: "HiddenWidget"
  },
  string: {
    text: "TextWidget",
    password: "PasswordWidget",
    email: "EmailWidget",
    hostname: "TextWidget",
    ipv4: "TextWidget",
    ipv6: "TextWidget",
    uri: "URLWidget",
    "data-url": "FileWidget",
    radio: "RadioWidget",
    select: "SelectWidget",
    textarea: "TextareaWidget",
    hidden: "HiddenWidget",
    date: "DateWidget",
    datetime: "DateTimeWidget",
    "date-time": "DateTimeWidget",
    "alt-date": "AltDateWidget",
    "alt-datetime": "AltDateTimeWidget",
    color: "ColorWidget",
    file: "FileWidget"
  },
  number: {
    text: "TextWidget",
    select: "SelectWidget",
    updown: "UpDownWidget",
    range: "RangeWidget",
    radio: "RadioWidget",
    hidden: "HiddenWidget"
  },
  integer: {
    text: "TextWidget",
    select: "SelectWidget",
    updown: "UpDownWidget",
    range: "RangeWidget",
    radio: "RadioWidget",
    hidden: "HiddenWidget"
  },
  array: {
    select: "SelectWidget",
    checkboxes: "CheckboxesWidget",
    files: "FileWidget"
  }
};

var defaultRegistry = {
  fields: require("./components/fields").default,
  widgets: require("./components/widgets").default,
  definitions: {},
  formContext: {}
};

function getDefaultRegistry() {
  return defaultRegistry;
}

function defaultFieldValue(formData, schema) {
  return typeof formData === "undefined" ? schema.default : formData;
}

function getWidget(schema, widget) {
  var registeredWidgets = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var type = schema.type;


  function mergeOptions(Widget) {
    // cache return value as property of widget for proper react reconciliation
    if (!Widget.MergedWidget) {
      (function () {
        var defaultOptions = Widget.defaultProps && Widget.defaultProps.options || {};
        Widget.MergedWidget = function (_ref) {
          var _ref$options = _ref.options,
              options = _ref$options === undefined ? {} : _ref$options,
              props = _objectWithoutProperties(_ref, ["options"]);

          return _react2.default.createElement(Widget, _extends({ options: _extends({}, defaultOptions, options) }, props));
        };
      })();
    }
    return Widget.MergedWidget;
  }

  if (typeof widget === "function") {
    return mergeOptions(widget);
  }

  if (typeof widget !== "string") {
    throw new Error("Unsupported widget definition: " + (typeof widget === "undefined" ? "undefined" : _typeof(widget)));
  }

  if (registeredWidgets.hasOwnProperty(widget)) {
    var registeredWidget = registeredWidgets[widget];
    return getWidget(schema, registeredWidget, registeredWidgets);
  }

  if (!widgetMap.hasOwnProperty(type)) {
    throw new Error("No widget for type \"" + type + "\"");
  }

  if (widgetMap[type].hasOwnProperty(widget)) {
    var _registeredWidget = registeredWidgets[widgetMap[type][widget]];
    return getWidget(schema, _registeredWidget, registeredWidgets);
  }

  throw new Error("No widget \"" + widget + "\" for type \"" + type + "\"");
}

function computeDefaults(schema, parentDefaults) {
  var definitions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  // Compute the defaults recursively: give highest priority to deepest nodes.
  var defaults = parentDefaults;
  if (isObject(defaults) && isObject(schema.default)) {
    // For object defaults, only override parent defaults that are defined in
    // schema.default.
    defaults = mergeObjects(defaults, schema.default);
  } else if ("default" in schema) {
    // Use schema defaults for this node.
    defaults = schema.default;
  } else if ("enum" in schema && Array.isArray(schema.enum)) {
    // For enum with no defined default, select the first entry.
    defaults = schema.enum[0];
  } else if ("$ref" in schema) {
    // Use referenced schema defaults for this node.
    var refSchema = findSchemaDefinition(schema.$ref, definitions);
    return computeDefaults(refSchema, defaults, definitions);
  } else if (isFixedItems(schema)) {
    defaults = schema.items.map(function (itemSchema) {
      return computeDefaults(itemSchema, undefined, definitions);
    });
  }
  // Not defaults defined for this node, fallback to generic typed ones.
  if (typeof defaults === "undefined") {
    defaults = schema.default;
  }
  // We need to recur for object schema inner default values.
  if (schema.type === "object") {
    return Object.keys(schema.properties).reduce(function (acc, key) {
      // Compute the defaults for this node, with the parent defaults we might
      // have from a previous run: defaults[key].
      acc[key] = computeDefaults(schema.properties[key], (defaults || {})[key], definitions);
      return acc;
    }, {});
  }
  return defaults;
}

function getDefaultFormState(_schema, formData) {
  var definitions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!isObject(_schema)) {
    throw new Error("Invalid schema: " + _schema);
  }
  var schema = retrieveSchema(_schema, definitions);
  var defaults = computeDefaults(schema, _schema.default, definitions);
  if (typeof formData === "undefined") {
    // No form data? Use schema defaults.
    return defaults;
  }
  if (isObject(formData)) {
    // Override schema defaults with form data.
    return mergeObjects(defaults, formData);
  }
  return formData || defaults;
}

function getUiOptions(uiSchema) {
  // get all passed options from ui:widget, ui:options, and ui:<optionName>
  return Object.keys(uiSchema).filter(function (key) {
    return key.indexOf("ui:") === 0;
  }).reduce(function (options, key) {
    var value = uiSchema[key];

    if (key === "ui:widget" && isObject(value)) {
      console.warn("Setting options via ui:widget object is deprecated, use ui:options instead");
      return _extends({}, options, value.options || {}, { widget: value.component });
    }
    if (key === "ui:options" && isObject(value)) {
      return _extends({}, options, value);
    }
    return _extends({}, options, _defineProperty({}, key.substring(3), value));
  }, {});
}

function isObject(thing) {
  return (typeof thing === "undefined" ? "undefined" : _typeof(thing)) === "object" && thing !== null && !Array.isArray(thing);
}

function mergeObjects(obj1, obj2) {
  var concatArrays = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  // Recursively merge deeply nested objects.
  var acc = Object.assign({}, obj1); // Prevent mutation of source object.
  return Object.keys(obj2).reduce(function (acc, key) {
    var left = obj1[key],
        right = obj2[key];
    if (obj1.hasOwnProperty(key) && isObject(right)) {
      acc[key] = mergeObjects(left, right, concatArrays);
    } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
      acc[key] = left.concat(right);
    } else {
      acc[key] = right;
    }
    return acc;
  }, acc);
}

function asNumber(value) {
  if (value === "") {
    return undefined;
  }
  if (/\.$/.test(value)) {
    // "3." can't really be considered a number even if it parses in js. The
    // user is most likely entering a float.
    return value;
  }
  if (/\.0$/.test(value)) {
    // we need to return this as a string here, to allow for input like 3.07
    return value;
  }
  var n = Number(value);
  var valid = typeof n === "number" && !Number.isNaN(n);

  if (/\.\d*0$/.test(value)) {
    // It's a number, that's cool - but we need it as a string so it doesn't screw
    // with the user when entering dollar amounts or other values (such as those with
    // specific precision or number of significant digits)
    return value;
  }

  return valid ? n : value;
}

function orderProperties(properties, order) {
  if (!Array.isArray(order)) {
    return properties;
  }

  var arrayToHash = function arrayToHash(arr) {
    return arr.reduce(function (prev, curr) {
      prev[curr] = true;
      return prev;
    }, {});
  };
  var errorPropList = function errorPropList(arr) {
    return arr.length > 1 ? "properties '" + arr.join("', '") + "'" : "property '" + arr[0] + "'";
  };
  var propertyHash = arrayToHash(properties);
  var orderHash = arrayToHash(order);
  var extraneous = order.filter(function (prop) {
    return prop !== "*" && !propertyHash[prop];
  });
  if (extraneous.length) {
    throw new Error("uiSchema order list contains extraneous " + errorPropList(extraneous));
  }
  var rest = properties.filter(function (prop) {
    return !orderHash[prop];
  });
  var restIndex = order.indexOf("*");
  if (restIndex === -1) {
    if (rest.length) {
      throw new Error("uiSchema order list does not contain " + errorPropList(rest));
    }
    return order;
  }
  if (restIndex !== order.lastIndexOf("*")) {
    throw new Error("uiSchema order list contains more than one wildcard item");
  }

  var complete = [].concat(_toConsumableArray(order));
  complete.splice.apply(complete, [restIndex, 1].concat(_toConsumableArray(rest)));
  return complete;
}

function isMultiSelect(schema) {
  return Array.isArray(schema.items.enum) && schema.uniqueItems;
}

function isFilesArray(schema, uiSchema) {
  return schema.items.type === "string" && schema.items.format === "data-url" || uiSchema["ui:widget"] === "files";
}

function isFixedItems(schema) {
  return Array.isArray(schema.items) && schema.items.length > 0 && schema.items.every(function (item) {
    return isObject(item);
  });
}

function allowAdditionalItems(schema) {
  if (schema.additionalItems === true) {
    console.warn("additionalItems=true is currently not supported");
  }
  return isObject(schema.additionalItems);
}

function optionsList(schema) {
  return schema.enum.map(function (value, i) {
    var label = schema.enumNames && schema.enumNames[i] || String(value);
    return { label: label, value: value };
  });
}

function findSchemaDefinition($ref) {
  var definitions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // Extract and use the referenced definition if we have it.
  var match = /#\/definitions\/(.*)$/.exec($ref);
  if (match && match[1] && definitions.hasOwnProperty(match[1])) {
    return definitions[match[1]];
  }
  // No matching definition found, that's an error (bogus schema?)
  throw new Error("Could not find a definition for " + $ref + ".");
}

function retrieveSchema(schema) {
  var definitions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // No $ref attribute found, returning the original schema.
  if (!schema.hasOwnProperty("$ref")) {
    return schema;
  }
  // Retrieve the referenced schema definition.
  var $refSchema = findSchemaDefinition(schema.$ref, definitions);
  // Drop the $ref property of the source schema.

  var $ref = schema.$ref,
      localSchema = _objectWithoutProperties(schema, ["$ref"]); // eslint-disable-line no-unused-vars
  // Update referenced schema definition with local schema properties.


  return _extends({}, $refSchema, localSchema);
}

function isArguments(object) {
  return Object.prototype.toString.call(object) === "[object Arguments]";
}

function deepEquals(a, b) {
  var ca = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var cb = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

  // Partially extracted from node-deeper and adapted to exclude comparison
  // checks for functions.
  // https://github.com/othiym23/node-deeper
  if (a === b) {
    return true;
  } else if (typeof a === "function" || typeof b === "function") {
    // Assume all functions are equivalent
    // see https://github.com/mozilla-services/react-jsonschema-form/issues/255
    return true;
  } else if ((typeof a === "undefined" ? "undefined" : _typeof(a)) !== "object" || (typeof b === "undefined" ? "undefined" : _typeof(b)) !== "object") {
    return false;
  } else if (a === null || b === null) {
    return false;
  } else if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  } else if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.global === b.global && a.multiline === b.multiline && a.lastIndex === b.lastIndex && a.ignoreCase === b.ignoreCase;
  } else if (isArguments(a) || isArguments(b)) {
    if (!(isArguments(a) && isArguments(b))) {
      return false;
    }
    var slice = Array.prototype.slice;
    return deepEquals(slice.call(a), slice.call(b), ca, cb);
  } else {
    if (a.constructor !== b.constructor) {
      return false;
    }

    var ka = Object.keys(a);
    var kb = Object.keys(b);
    // don't bother with stack acrobatics if there's nothing there
    if (ka.length === 0 && kb.length === 0) {
      return true;
    }
    if (ka.length !== kb.length) {
      return false;
    }

    var cal = ca.length;
    while (cal--) {
      if (ca[cal] === a) {
        return cb[cal] === b;
      }
    }
    ca.push(a);
    cb.push(b);

    ka.sort();
    kb.sort();
    for (var j = ka.length - 1; j >= 0; j--) {
      if (ka[j] !== kb[j]) {
        return false;
      }
    }

    var key = void 0;
    for (var k = ka.length - 1; k >= 0; k--) {
      key = ka[k];
      if (!deepEquals(a[key], b[key], ca, cb)) {
        return false;
      }
    }

    ca.pop();
    cb.pop();

    return true;
  }
}

function shouldRender(comp, nextProps, nextState) {
  var props = comp.props,
      state = comp.state;

  return !deepEquals(props, nextProps) || !deepEquals(state, nextState);
}

function toIdSchema(schema, id, definitions) {
  var idSchema = {
    $id: id || "root"
  };
  if ("$ref" in schema) {
    var _schema = retrieveSchema(schema, definitions);
    return toIdSchema(_schema, id, definitions);
  }
  if ("items" in schema) {
    return toIdSchema(schema.items, id, definitions);
  }
  if (schema.type !== "object") {
    return idSchema;
  }
  for (var name in schema.properties || {}) {
    var field = schema.properties[name];
    var fieldId = idSchema.$id + "_" + name;
    idSchema[name] = toIdSchema(field, fieldId, definitions);
  }
  return idSchema;
}

function parseDateString(dateString) {
  var includeTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  if (!dateString) {
    return {
      year: -1,
      month: -1,
      day: -1,
      hour: includeTime ? -1 : 0,
      minute: includeTime ? -1 : 0,
      second: includeTime ? -1 : 0
    };
  }
  var date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Unable to parse date " + dateString);
  }
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1, // oh you, javascript.
    day: date.getUTCDate(),
    hour: includeTime ? date.getUTCHours() : 0,
    minute: includeTime ? date.getUTCMinutes() : 0,
    second: includeTime ? date.getUTCSeconds() : 0
  };
}

function toDateString(_ref2) {
  var year = _ref2.year,
      month = _ref2.month,
      day = _ref2.day,
      _ref2$hour = _ref2.hour,
      hour = _ref2$hour === undefined ? 0 : _ref2$hour,
      _ref2$minute = _ref2.minute,
      minute = _ref2$minute === undefined ? 0 : _ref2$minute,
      _ref2$second = _ref2.second,
      second = _ref2$second === undefined ? 0 : _ref2$second;
  var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  var utcTime = Date.UTC(year, month - 1, day, hour, minute, second);
  var datetime = new Date(utcTime).toJSON();
  return time ? datetime : datetime.slice(0, 10);
}

function pad(num, size) {
  var s = String(num);
  while (s.length < size) {
    s = "0" + s;
  }
  return s;
}

function setState(instance, state, callback) {
  var safeRenderCompletion = instance.props.safeRenderCompletion;

  if (safeRenderCompletion) {
    instance.setState(state, callback);
  } else {
    instance.setState(state);
    setImmediate(callback);
  }
}

function dataURItoBlob(dataURI) {
  // Split metadata from data
  var splitted = dataURI.split(",");
  // Split params
  var params = splitted[0].split(";");
  // Get mime-type from params
  var type = params[0].replace("data:", "");
  // Filter the name property from params
  var properties = params.filter(function (param) {
    return param.split("=")[0] === "name";
  });
  // Look for the name and use unknown if no name property.
  var name = void 0;
  if (properties.length !== 1) {
    name = "unknown";
  } else {
    // Because we filtered out the other property,
    // we only have the name case here.
    name = properties[0].split("=")[1];
  }

  // Built the Uint8Array Blob parameter from the base64 string.
  var binary = atob(splitted[1]);
  var array = [];
  for (var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  // Create the blob object
  var blob = new window.Blob([new Uint8Array(array)], { type: type });

  return { blob: blob, name: name };
}

function rangeSpec(schema) {
  var spec = {};
  if (schema.multipleOf) {
    spec.step = schema.multipleOf;
  }
  if (schema.minimum || schema.minimum === 0) {
    spec.min = schema.minimum;
  }
  if (schema.maximum || schema.maximum === 0) {
    spec.max = schema.maximum;
  }
  return spec;
}