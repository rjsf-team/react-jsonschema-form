import PasswordWidget from "./components/widgets/PasswordWidget";
import RadioWidget from "./components/widgets/RadioWidget";
import UpDownWidget from "./components/widgets/UpDownWidget";
import RangeWidget from "./components/widgets/RangeWidget";
import SelectWidget from "./components/widgets/SelectWidget";
import TextareaWidget from "./components/widgets/TextareaWidget";


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

export function getAlternativeWidget(type, name) {
  switch(type) {
  case "boolean":
    switch(name) {
    case "radio": return RadioWidget;
    case "select": return SelectWidget;
    default:
      throw new Error(`No alternative widget "${name}" for type ${type}`);
    }
    break;
  case "string":
    switch(name) {
    case "password": return PasswordWidget;
    case "radio": return RadioWidget;
    case "select": return SelectWidget;
    case "textarea": return TextareaWidget;
    default:
      throw new Error(`No alternative widget "${name}" for type ${type}`);
    }
    break;
  case "number":
  case "integer":
    switch(name) {
    case "updown": return UpDownWidget;
    case "range": return RangeWidget;
    default:
      throw new Error(`No alternative widget "${name}" for type ${type}`);
    }
    break;
  default:
    throw new Error(`No alternative widget for type ${type}`);
  }
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
  const n = Number(value);
  const valid = typeof n === "number" && !Number.isNaN(n);
  return valid ? n : value;
}
