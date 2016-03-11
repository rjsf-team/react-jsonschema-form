import PasswordWidget from "./components/widgets/PasswordWidget";
import RadioWidget from "./components/widgets/RadioWidget";
import UpDownWidget from "./components/widgets/UpDownWidget";
import RangeWidget from "./components/widgets/RangeWidget";
import SelectWidget from "./components/widgets/SelectWidget";
import TextareaWidget from "./components/widgets/TextareaWidget";


const altWidgetMap = {
  boolean: {
    radio: RadioWidget,
    select: SelectWidget,
  },
  string: {
    password: PasswordWidget,
    radio: RadioWidget,
    select: SelectWidget,
    textarea: TextareaWidget,
  },
  number: {
    updown: UpDownWidget,
    range: RangeWidget,
  },
  integer: {
    updown: UpDownWidget,
    range: RangeWidget,
  }
};

export function defaultTypeValue(type) {
  switch (type) {
  case "array":     return [];
  case "boolean":   return false;
  case "date-time": return "";
  case "number":    return 0;
  case "object":    return {};
  case "string":    return "";
  default:        return undefined;
  }
}

export function defaultFieldValue(formData, schema) {
  return formData === null ? defaultTypeValue(schema.type) : formData;
}

export function getAlternativeWidget(type, widget) {
  if (typeof widget === "function") {
    return widget;
  }
  if (typeof widget !== "string") {
    throw new Error(`Unsupported widget definition: ${typeof widget}`);
  }
  if (!altWidgetMap.hasOwnProperty(type)) {
    throw new Error(`No alternative widget for type ${type}`);
  }
  if (!altWidgetMap[type].hasOwnProperty(widget)) {
    throw new Error(`No alternative widget "${widget}" for type ${type}`);
  }
  return altWidgetMap[type][widget];
}

export function getDefaultFormState(schema, formData) {
  if (typeof schema !== "object") {
    throw new Error("Invalid schema: " + schema);
  }
  if ("default" in schema) {
    return schema.default;
  }
  if (schema.type === "object") {
    var schemaDefaultData = Object.keys(schema.properties).reduce((acc, key) => {
      // XXX !!!! deal with recursive on formData too.
      acc[key] = getDefaultFormState(schema.properties[key]);
      return acc;
    }, {});
    if (typeof(formData) == "undefined") {
      return schemaDefaultData;
    }
    return mergeObjects(schemaDefaultData, formData);
  }
  return formData || defaultTypeValue(schema.type);
}

function isObject(thing) {
  return typeof(thing) == "object" && !Array.isArray(thing);
}

export function mergeObjects(obj1, obj2) {
  // Recursively merge deeply nested objects.
  var acc = Object.assign({}, obj1); // Prevent mutation of source object.
  return Object.keys(obj2).reduce((acc, key) =>{
    const right = obj2[key];
    if (obj1.hasOwnProperty(key) && isObject(right)) {
      acc[key] = mergeObjects(obj1[key], right);
    } else {
      acc[key] = right;
    }
    return acc;
  }, acc);
}

export function asNumber(value) {
  const n = Number(value);
  const valid = typeof n === "number" && !Number.isNaN(n);
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
