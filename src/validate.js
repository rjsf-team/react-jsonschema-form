import { validate as jsonValidate } from "jsonschema";

import { isObject, toErrorSchema, toErrorList, mergeObjects } from "./utils";


function createErrorHandler(formData) {
  const handler = {
    // We store the list of errors for this node in a property named __errors
    // to avoid name collision with a possible sub schema field named
    // "errors" (see `utils.toErrorSchema`).
    __errors: [],
    addError(message) {
      this.__errors.push(message);
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

/**
 * This function processes the formData with a user `validate` contributed
 * function, which receives the form data and an `errorHandler` object that
 * will be used to add custom validation errors for each field.
 */
export default function validateFormData(formData, schema, customValidate) {
  const {errors} = jsonValidate(formData, schema);
  const errorSchema = toErrorSchema(errors);

  if (typeof customValidate !== "function") {
    return {errors, errorSchema};
  }

  const errorHandler = customValidate(formData, createErrorHandler(formData));
  const userErrorSchema = unwrapErrorHandler(errorHandler);
  const newErrorSchema = mergeObjects(errorSchema, userErrorSchema, true);
  const newErrors = toErrorList(newErrorSchema);

  return {errors: newErrors, errorSchema: newErrorSchema};
}
