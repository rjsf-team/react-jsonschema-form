import {validate as jsonValidate} from "jsonschema";

import {isObject, mergeObjects} from "./utils";


const RE_ERROR_ARRAY_PATH = /\[\d+]/g;

function errorPropertyToPath(property) {
  // Parse array indices, eg. "instance.level1.level2[2].level3"
  // => ["instance", "level1", "level2", 2, "level3"]
  return property.split(".").reduce((path, node) => {
    const match = node.match(RE_ERROR_ARRAY_PATH);
    if (match) {
      const nodeName = node.slice(0, node.indexOf("["));
      const indices = match.map(str => parseInt(str.slice(1, -1), 10));
      path = path.concat(nodeName, indices);
    } else {
      path.push(node);
    }
    return path;
  }, []);
}

function toErrorSchema(errors) {
  // Transforms a jsonschema validation errors list:
  // [
  //   {property: "instance.level1.level2[2].level3", message: "err a"},
  //   {property: "instance.level1.level2[2].level3", message: "err b"},
  //   {property: "instance.level1.level2[4].level3", message: "err b"},
  // ]
  // Into an error tree:
  // {
  //   level1: {
  //     level2: {
  //       2: {level3: {errors: ["err a", "err b"]}},
  //       4: {level3: {errors: ["err b"]}},
  //     }
  //   }
  // };
  if (!errors.length) {
    return {};
  }
  return errors.reduce((errorSchema, error) => {
    const {property, message} = error;
    const path = errorPropertyToPath(property);
    let parent = errorSchema;
    for (const segment of path.slice(1)) {
      if (!(segment in parent)) {
        parent[segment] = {};
      }
      parent = parent[segment];
    }
    if (Array.isArray(parent.__errors)) {
      // We store the list of errors for this node in a property named __errors
      // to avoid name collision with a possible sub schema field named
      // "errors" (see `validate.createErrorHandler`).
      parent.__errors = parent.__errors.concat(message);
    } else {
      parent.__errors = [message];
    }
    return errorSchema;
  }, {});
}

export function toErrorList(errorSchema, fieldName = "root") {
  // XXX: We should transform fieldName as a full field path string.
  let errorList = [];
  if ("__errors" in errorSchema) {
    errorList = errorList.concat(errorSchema.__errors.map(stack => {
      return {
        stack: `${fieldName}: ${stack}`
      };
    }));
  }
  return Object.keys(errorSchema).reduce((acc, key) => {
    if (key !== "__errors") {
      acc = acc.concat(toErrorList(errorSchema[key], key));
    }
    return acc;
  }, errorList);
}

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

// function getRequiredFieldErrors(propSchema, requiredErrors){
//   let requiredKey = propSchema.required;
//   if(requiredKey){
    
//   }
// }

function formatJsonValidateResult(jsonValidateResult){
  const {errors, schema} = jsonValidateResult;

  const newErrors = errors.map((error) => {
    // If this is a required property error for an object, then
    // re-frame the validation error as a 'Field is required' 
    // error for the specified property...
    if (error.name === "required") {
      error.property += "." + error.argument;
      error.message = "Field is required";
      error.schema = error.schema.properties[error.argument];
    }
    // If custom validation messages are defined for this property,
    // and a custom validation message exists for this particular
    // validation error, then set it in place of the default 
    // validation message coming out of the jsonschema validator...
    if (error.schema.errors && error.schema.errors[error.name]) {
      error.message = error.schema.errors[error.name];
    }
    // Otherwise, for the default validation message coming out of the
    // jsonschema validator, capitalize the first letter for nicer
    // formatting...
    else {
      error.message = error.message.charAt(0).toUpperCase() + error.message.slice(1);
    }
    // Format error stack message to format: "[Prop Title]: Error Message"
    error.stack = error.schema.title + ": " + error.message;
    return error;
  });
  return Object.assign({}, jsonValidateResult, {
    errors: newErrors
  });
}

/**
 * This function processes the formData with a user `validate` contributed
 * function, which receives the form data and an `errorHandler` object that
 * will be used to add custom validation errors for each field.
 */
export default function validateFormData(formData, schema, customValidate) {
  const {errors} = formatJsonValidateResult(jsonValidate(formData, schema));
  const errorSchema = toErrorSchema(errors);

  if (typeof customValidate !== "function") {
    return {errors, errorSchema};
  }

  const errorHandler = customValidate(formData, createErrorHandler(formData));
  const userErrorSchema = unwrapErrorHandler(errorHandler);
  const newErrorSchema = mergeObjects(errorSchema, userErrorSchema, true);
  // XXX: The errors list produced is not fully compliant with the format
  // exposed by the jsonschema lib, which contains full field paths and other
  // properties.
  const newErrors = toErrorList(newErrorSchema);

  return {errors: newErrors, errorSchema: newErrorSchema};
}
