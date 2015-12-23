import RadioWidget from "./components/widgets/RadioWidget";
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

export function getAlternativeWidget(name) {
  switch(name) {
  case "radio": return RadioWidget;
  case "select": return SelectWidget;
  case "textarea": return TextareaWidget;
  default: throw new Error(`No alternative widget for "${name}"`);
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
