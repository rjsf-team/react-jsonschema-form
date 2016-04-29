import { isObject, toErrorList, mergeObjects } from "./utils";


function wrapFormDataValue(value) {
  return {
    __errors: [],
    getValue() {
      return value;
    },
    addError(message) {
      this.__errors.push(message);
    },
  };
}

function wrapFormData(formData) {
  if (!isObject(formData)) {
    return wrapFormDataValue(formData);
  }
  return Object.keys(formData).reduce((acc, key) => {
    return {...acc, [key]: wrapFormDataValue(formData[key])};
  }, wrapFormDataValue(formData));
}

function extractWrappedErrors(wrappedFormData) {
  return Object.keys(wrappedFormData).reduce((acc, key) => {
    if (key === "addError" || key === "getValue") {
      return acc;
    } else if (key === "__errors") {
      return {...acc, [key]: wrappedFormData[key]};
    }
    return {...acc, [key]: extractWrappedErrors(wrappedFormData[key])};
  }, {});
}

export default function userValidate(validate, formData, schema, errorSchema) {
  const validationResult = validate(wrapFormData(formData), schema);
  const unWrappedErrors = extractWrappedErrors(validationResult);
  const newErrorSchema = mergeObjects(errorSchema, unWrappedErrors, true);
  const newErrors = toErrorList(newErrorSchema);
  return {errors: newErrors, errorSchema: newErrorSchema};
}
