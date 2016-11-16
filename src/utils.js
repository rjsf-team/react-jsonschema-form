import "setimmediate";

import TitleField from "./components/fields/TitleField";
import DescriptionField from "./components/fields/DescriptionField";
import PasswordWidget from "./components/widgets/PasswordWidget";
import RadioWidget from "./components/widgets/RadioWidget";
import UpDownWidget from "./components/widgets/UpDownWidget";
import RangeWidget from "./components/widgets/RangeWidget";
import SelectWidget from "./components/widgets/SelectWidget";
import TextWidget from "./components/widgets/TextWidget";
import DateWidget from "./components/widgets/DateWidget";
import DateTimeWidget from "./components/widgets/DateTimeWidget";
import AltDateWidget from "./components/widgets/AltDateWidget";
import EPBCDateWidget from "./components/widgets/EPBCDateWidget";
import AltDateTimeWidget from "./components/widgets/AltDateTimeWidget";
import EmailWidget from "./components/widgets/EmailWidget";
import URLWidget from "./components/widgets/URLWidget";
import TextareaWidget from "./components/widgets/EPBCTextareaWidget";
import HiddenWidget from "./components/widgets/HiddenWidget";
import ColorWidget from "./components/widgets/ColorWidget";
import FileWidget from "./components/widgets/FileWidget";
import CheckboxesWidget from "./components/widgets/CheckboxesWidget";



const altWidgetMap = {
  boolean: {
    radio: RadioWidget,
    select: SelectWidget,
    hidden: HiddenWidget,
  },
  string: {
    password: PasswordWidget,
    radio: RadioWidget,
    select: SelectWidget,
    textarea: TextareaWidget,
    hidden: HiddenWidget,
    date: DateWidget,
    datetime: DateTimeWidget,
    "alt-date": AltDateWidget,
    "epbc-date": EPBCDateWidget,
    "alt-datetime": AltDateTimeWidget,
    color: ColorWidget,
    file: FileWidget,
  },
  number: {
    updown: UpDownWidget,
    range: RangeWidget,
    radio: RadioWidget,
    hidden: HiddenWidget,
  },
  integer: {
    updown: UpDownWidget,
    range: RangeWidget,
    radio: RadioWidget,
    hidden: HiddenWidget,
  },
  array: {
    select: SelectWidget,
    checkboxes: CheckboxesWidget,
  }
};

const stringFormatWidgets = {
  "date-time": DateTimeWidget,
  "date": DateWidget,
  "email": EmailWidget,
  "hostname": TextWidget,
  "ipv4": TextWidget,
  "ipv6": TextWidget,
  "uri": URLWidget,
  "data-url": FileWidget,
};

export function getDefaultRegistry() {
  return {
    fields: {
      // Prevent a bug where SchemaField is undefined when imported via Babel.
      // This seems to have been introduced when upgrading React from 0.14 to to
      // 15.0, which now seems to prevent cyclic references of exported
      // components.
      // Investigation hint: getDefaultRegistry is called from within
      // SchemaField itself.
      SchemaField: require("./components/fields/SchemaField").default,
      TitleField,
      DescriptionField,
    },
    widgets: {},
    definitions: {},
    formContext: {}
  };
}

export function defaultFieldValue(formData, schema) {
  return typeof formData === "undefined" ? schema.default : formData;
}

export function getAlternativeWidget(
  schema,
  widget,
  registeredWidgets={},
  widgetOptions={}
) {
  const {type, format} = schema;

  function setDefaultOptions(widget) {
    const {defaultProps={}} = widget;
    widget.defaultProps = {
      ...defaultProps,
      options: {
        ...defaultProps.options,
        ...widgetOptions
      }
    };
    return widget;
  }

  if (typeof widget === "function") {
    return setDefaultOptions(widget);
  }

  if (isObject(widget)) {
    const {component, options} = widget;
    const mergedOptions = {...options, ...widgetOptions};
    return getAlternativeWidget(schema, component, registeredWidgets, mergedOptions);
  }

  if (typeof widget !== "string") {
    throw new Error(`Unsupported widget definition: ${typeof widget}`);
  }

  if (registeredWidgets.hasOwnProperty(widget)) {
    const registeredWidget = registeredWidgets[widget];
    return getAlternativeWidget(schema, registeredWidget, registeredWidgets, widgetOptions);
  }

  if (!altWidgetMap.hasOwnProperty(type)) {
    throw new Error(`No alternative widget for type ${type}`);
  }

  if (altWidgetMap[type].hasOwnProperty(widget)) {
    const altWidget = altWidgetMap[type][widget];
    return getAlternativeWidget(schema, altWidget, registeredWidgets, widgetOptions);
  }

  if (type === "string" && stringFormatWidgets.hasOwnProperty(format)) {
    const stringFormatWidget = stringFormatWidgets[format];
    return getAlternativeWidget(schema, stringFormatWidget, registeredWidgets, widgetOptions);
  }

  const info = type === "string" && format ? `/${format}` : "";
  throw new Error(`No alternative widget "${widget}" for type ${type}${info}`);
}

function computeDefaults(schema, parentDefaults, definitions={}) {
  // Compute the defaults recursively: give highest priority to deepest nodes.
  let defaults = parentDefaults;
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
    const refSchema = findSchemaDefinition(schema.$ref, definitions);
    return computeDefaults(refSchema, defaults, definitions);
  } else if (isFixedItems(schema)) {
    defaults = schema.items.map(itemSchema => computeDefaults(itemSchema, undefined, definitions));
  }
  // Not defaults defined for this node, fallback to generic typed ones.
  if (typeof(defaults) === "undefined") {
    defaults = schema.default;
  }
  // We need to recur for object schema inner default values.
  if (schema.type === "object") {
    return Object.keys(schema.properties).reduce((acc, key) => {
      // Compute the defaults for this node, with the parent defaults we might
      // have from a previous run: defaults[key].
      acc[key] = computeDefaults(
        schema.properties[key], (defaults || {})[key], definitions);
      return acc;
    }, {});
  }
  return defaults;
}

export function getDefaultFormState(_schema, formData, definitions={}) {
  if (!isObject(_schema)) {
    throw new Error("Invalid schema: " + _schema);
  }
  const schema = retrieveSchema(_schema, definitions);
  const defaults = computeDefaults(schema, _schema.default, definitions);
  if (typeof(formData) === "undefined") { // No form data? Use schema defaults.
    return defaults;
  }
  if (isObject(formData)) { // Override schema defaults with form data.
    return mergeObjects(defaults, formData);
  }
  return formData || defaults;
}

export function isObject(thing) {
  return typeof thing === "object" && thing !== null && !Array.isArray(thing);
}

export function mergeObjects(obj1, obj2, concatArrays = false) {
  // Recursively merge deeply nested objects.
  var acc = Object.assign({}, obj1); // Prevent mutation of source object.
  return Object.keys(obj2).reduce((acc, key) =>{
    const left = obj1[key], right = obj2[key];
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

export function asNumber(value) {
  if (/\.$/.test(value)) {
    // "3." can't really be considered a number even if it parses in js. The
    // user is most likely entering a float.
    return value;
  }
  if (/\.0$/.test(value)) {
    // we need to return this as a string here, to allow for input like 3.07
    return value;
  }
  const n = Number(value);
  const valid = typeof n === "number" && !Number.isNaN(n);

  if (/\.\d*0$/.test(value)) {
    // It's a number, that's cool - but we need it as a string so it doesn't screw
    // with the user when entering dollar amounts or other values (such as those with
    // specific precision or number of significant digits)
    return value;
  }

  return valid ? n : value;
}

export function orderProperties(properties, order) {
  if (!Array.isArray(order)) {
    return properties;
  }
  if (order.length !== properties.length) {
    throw new Error(
      "uiSchema order list length should match object properties length");
  }
  const fingerprint = (arr) => [].slice.call(arr).sort().toString();
  if (fingerprint(order) !== fingerprint(properties)) {
    throw new Error(
      "uiSchema order list does not match object properties list");
  }
  return order;
}

export function isMultiSelect(schema) {
  return Array.isArray(schema.items.enum) && schema.uniqueItems;
}

export function isFilesArray(schema, uiSchema) {
  return (
    schema.items.type === "string" && schema.items.format === "data-url"
  ) || uiSchema["ui:widget"] === "files";
}

export function isFixedItems(schema) {
  return Array.isArray(schema.items) &&
         schema.items.length > 0 &&
         schema.items.every(item => isObject(item));
}

export function allowAdditionalItems(schema) {
  if (schema.additionalItems === true) {
    console.warn("additionalItems=true is currently not supported");
  }
  return isObject(schema.additionalItems);
}

export function optionsList(schema) {
  return schema.enum.map((value, i) => {
    const label = schema.enumNames && schema.enumNames[i] || String(value);
    return {label, value};
  });
}

function findSchemaDefinition($ref, definitions={}) {
  // Extract and use the referenced definition if we have it.
  const match = /#\/definitions\/(.*)$/.exec($ref);
  if (match && match[1] && definitions.hasOwnProperty(match[1])) {
    return definitions[match[1]];
  }
  // No matching definition found, that's an error (bogus schema?)
  throw new Error(`Could not find a definition for ${$ref}.`);
}

export function retrieveSchema(schema, definitions={}) {
  // No $ref attribute found, returning the original schema.
  if (!schema.hasOwnProperty("$ref")) {
    return schema;
  }
  // Retrieve the referenced schema definition.
  const $refSchema = findSchemaDefinition(schema.$ref, definitions);
  // Drop the $ref property of the source schema.
  const {$ref, ...localSchema} = schema; // eslint-disable-line no-unused-vars
  // Update referenced schema definition with local schema properties.
  return {...$refSchema, ...localSchema};
}

function isArguments (object) {
  return Object.prototype.toString.call(object) === "[object Arguments]";
}

export function deepEquals(a, b, ca = [], cb = []) {
  // Partially extracted from node-deeper and adapted to exclude comparison
  // checks for functions.
  // https://github.com/othiym23/node-deeper
  if (a === b) {
    return true;
  } else if (typeof a === "function" || typeof b === "function") {
    // Assume all functions are equivalent
    // see https://github.com/mozilla-services/react-jsonschema-form/issues/255
    return true;
  } else if (typeof a !== "object" || typeof b !== "object") {
    return false;
  } else if (a === null || b === null) {
    return false;
  } else if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  } else if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source &&
    a.global === b.global &&
    a.multiline === b.multiline &&
    a.lastIndex === b.lastIndex &&
    a.ignoreCase === b.ignoreCase;
  } else if (isArguments(a) || isArguments(b)) {
    if (!(isArguments(a) && isArguments(b))) {
      return false;
    }
    let slice = Array.prototype.slice;
    return deepEquals(slice.call(a), slice.call(b), ca, cb);
  } else {
    if (a.constructor !== b.constructor) {
      return false;
    }

    let ka = Object.keys(a);
    let kb = Object.keys(b);
    // don't bother with stack acrobatics if there's nothing there
    if (ka.length === 0 && kb.length === 0) {
      return true;
    }
    if (ka.length !== kb.length) {
      return false;
    }

    let cal = ca.length;
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

    let key;
    for (let k = ka.length - 1; k >= 0; k--) {
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

export function shouldRender(comp, nextProps, nextState) {
  const {props, state} = comp;
  return !deepEquals(props, nextProps) || !deepEquals(state, nextState);
}

export function toIdSchema(schema, id, definitions) {
  const idSchema = {
    $id: id || "root"
  };
  if ("$ref" in schema) {
    const _schema = retrieveSchema(schema, definitions);
    return toIdSchema(_schema, id, definitions);
  }
  if ("items" in schema) {
    return toIdSchema(schema.items, id, definitions);
  }
  if (schema.type !== "object") {
    return idSchema;
  }
  for (const name in schema.properties || {}) {
    const field = schema.properties[name];
    const fieldId = idSchema.$id + "_" + name;
    idSchema[name] = toIdSchema(field, fieldId, definitions);
  }
  return idSchema;
}

export function parseDateString(dateString, includeTime = true) {
  if (!dateString) {
    return {
      year: -1,
      month: -1,
      day: -1,
      hour: includeTime ? -1 : 0,
      minute: includeTime ? -1 : 0,
      second: includeTime ? -1 : 0,
    };
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Unable to parse date " + dateString);
  }
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1, // oh you, javascript.
    day: date.getUTCDate(),
    hour: includeTime ? date.getUTCHours() : 0,
    minute: includeTime ? date.getUTCMinutes() : 0,
    second: includeTime ? date.getUTCSeconds() : 0,
  };
}

export function toDateString({
  year,
  month,
  day,
  hour=0,
  minute=0,
  second=0
}, time = true) {
  const utcTime = Date.UTC(year, month - 1, day, hour, minute, second);
  const datetime = new Date(utcTime).toJSON();
  return time ? datetime : datetime.slice(0, 10);
}

export function pad(num, size) {
  let s = String(num);
  while (s.length < size) {
    s = "0" + s;
  }
  return s;
}

export function setState(instance, state, callback) {
  const {safeRenderCompletion} = instance.props;
  if (safeRenderCompletion) {
    instance.setState(state, callback);
  } else {
    instance.setState(state);
    setImmediate(callback);
  }
}

export function dataURItoBlob(dataURI) {
  // Split metadata from data
  const splitted = dataURI.split(",");
  // Split params
  const params = splitted[0].split(";");
  // Get mime-type from params
  const type = params[0].replace("data:", "");
  // Filter the name property from params
  const properties = params.filter(param => {
    return param.split("=")[0] === "name";
  });
  // Look for the name and use unknown if no name property.
  let name;
  if (properties.length !== 1) {
    name = "unknown";
  } else {
    // Because we filtered out the other property,
    // we only have the name case here.
    name = properties[0].split("=")[1];
  }

  // Built the Uint8Array Blob parameter from the base64 string.
  const binary = atob(splitted[1]);
  const array = [];
  for(let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  // Create the blob object
  const blob = new window.Blob([new Uint8Array(array)], {type});

  return {blob, name};
}

export function rangeSpec(schema) {
  const spec = {};
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
