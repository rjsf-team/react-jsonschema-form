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

export function getDefaultFormState(schema) {
  if (typeof schema !== "object") {
    throw new Error("Invalid schema: " + schema);
  }
  if ("default" in schema) {
    return schema.default;
  }
  if (schema.type === "object") {
    return Object.keys(schema.properties).reduce((acc, key) => {
      acc[key] = getDefaultFormState(schema.properties[key]);
      return acc;
    }, {});
  }
  return defaultTypeValue(schema.type);
}

export function asNumber(value) {
  if (/\.$/.test(value)) {
    // "3." can't really be considered a number even if it parses in js. The
    // user is most likely entering a float.
    return value;
  }
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
