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
