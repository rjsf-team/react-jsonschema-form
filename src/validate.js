import { isObject, toErrorList, mergeObjects } from "./utils";


function createErrorHandler(formData) {
  const handler = {
    __errors: [],
    addError(message) {
      this.__errors = [...this.__errors, message];
    },
  };
  if (isObject(formData)) {
    return Object.keys(formData).reduce((acc, key) => {
      return {...acc, [key]: createErrorHandler(formData[key])};
    }, handler);
  }
  return handler;
}

function unwrapErrorHandler(errorHandler) {
  return Object.keys(errorHandler).reduce((acc, key) => {
    if (key === "addError") {
      return acc;
    } else if (key === "__errors") {
      return {...acc, [key]: errorHandler[key]};
    }
    return {...acc, [key]: unwrapErrorHandler(errorHandler[key])};
  }, {});
}

export default function userValidate(validate, formData, errorSchema) {
  const errorHandler = validate(formData, createErrorHandler(formData));
  const userErrorSchema = unwrapErrorHandler(errorHandler);
  const newErrorSchema = mergeObjects(errorSchema, userErrorSchema, true);
  const newErrors = toErrorList(newErrorSchema);
  return {errors: newErrors, errorSchema: newErrorSchema};
}
