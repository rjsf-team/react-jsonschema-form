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

function comparisonConditionIsSatisfied(validatingPropertyValue, comparisonPropertyValue, conditionType) {
  if (typeof validatingPropertyValue !== typeof comparisonPropertyValue) {
    return false;
  }
  // If this is a string, and it hasn't yet been specified, defer display of an error
  // message until a value has been provided...  
  if (typeof validatingPropertyValue === "string" && validatingPropertyValue.length === 0) {
    return false;
  }

  switch (conditionType) {
    case "equal":
      return validatingPropertyValue !== comparisonPropertyValue;
    case "not-equal":
      return validatingPropertyValue === comparisonPropertyValue;
    case "greater-than":
      return validatingPropertyValue <= comparisonPropertyValue;
    case "greater-than-equal":
      return validatingPropertyValue < comparisonPropertyValue;
    case "less-than":
      return validatingPropertyValue >= comparisonPropertyValue;
    case "less-than-equal":
      return validatingPropertyValue > comparisonPropertyValue;
    default:
      return false;
  }
}

function formatJsonValidateResult(jsonValidateResult){
  const {instance, errors, schema} = jsonValidateResult;
  const formData = instance;

  const extValidationErrors = [];

  const evaluateExtendedValidations = (schema, formData, formDataPath) => {
    if (Array.isArray(formData)) {
      for (let i = 0; i < formData.length; i++) {
        evaluateExtendedValidations(schema.items, formData[i] + "[" + i + "]");
      }
    }
    else if (typeof formData === "object") {
      const keys = Object.keys(formData);
      const extValidations = schema["ext:validations"];      
      if (extValidations) {
        const extValidationKeys = Object.keys(extValidations);
        for (let i = 0; i < extValidationKeys.length; i++) {
          const validatingPropertyName = extValidationKeys[i];
          const validatingPropertyValue = formData[validatingPropertyName];
          const comparisonCondition = extValidations[validatingPropertyName].condition;
          // If we are validating this property against a value...
          if (extValidations[validatingPropertyName].value) {
            const comparisonValue = extValidations[validatingPropertyName].value;
            if (comparisonConditionIsSatisfied(validatingPropertyValue, comparisonValue, comparisonCondition)) {
              const newExtValidationError = {};
              const validationMessage = extValidations[validatingPropertyName].message ? extValidations[validatingPropertyName].message 
                : validatingPropertyName + " must be " + comparisonCondition + " to " + comparisonValue;
              newExtValidationError.argument = comparisonValue;
              newExtValidationError.instance = validatingPropertyValue;
              newExtValidationError.message = validationMessage;
              newExtValidationError.name = "ext:validations:" + comparisonCondition;
              newExtValidationError.property = formDataPath + "." + validatingPropertyName;
              newExtValidationError.schema = schema.properties[validatingPropertyName];
              newExtValidationError.stack = schema.properties[validatingPropertyName].title + ": " + validationMessage + ".";
              
              extValidationErrors.push(newExtValidationError);
            }
          }
          // Otherwise, we must be validating this property against another
          // property...
          else {
            const validatingPropertyValue = formData[validatingPropertyName];
            const comparisonPropertyName = extValidations[validatingPropertyName].prop;
            const comparisonPropertyValue = formData[comparisonPropertyName];
            if (comparisonConditionIsSatisfied(validatingPropertyValue, comparisonPropertyValue, comparisonCondition)) {
              const newExtValidationError = {};
              const validationMessage = extValidations[validatingPropertyName].message ? extValidations[validatingPropertyName].message 
                : validatingPropertyName + " must be " + comparisonCondition + " to " + comparisonPropertyName + " (" + comparisonPropertyValue + ")";
              newExtValidationError.argument = comparisonPropertyName + " (" + comparisonPropertyValue + ")";
              newExtValidationError.instance = validatingPropertyValue;
              newExtValidationError.message = validationMessage;
              newExtValidationError.name = "ext:validations:" + comparisonCondition;
              newExtValidationError.property = formDataPath + "." + validatingPropertyName;
              newExtValidationError.schema = schema.properties[validatingPropertyName];
              newExtValidationError.stack = schema.properties[validatingPropertyName].title + ": " + validationMessage + ".";

              extValidationErrors.push(newExtValidationError);
            }
          }
        } 
      }
      for (let i = 0; i < keys.length; i++) {
        const formDataPropertyName = keys[i];
        const formDataPropertyValue = formData[formDataPropertyName];
        // If this property is an object, the recursively call evaluateExtendedValidations...
        if (typeof formDataPropertyValue === "object") {
          evaluateExtendedValidations(schema.properties[formDataPropertyName], formData[formDataPropertyName], formDataPath + "." + formDataPropertyName);
        }
      }
    }
  }

  // Evaluate extended validations (if present) if this form is bound to an object...
  if (typeof formData === "object") {
    evaluateExtendedValidations(schema, formData, "instance");
  }

  const newErrors = errors.filter((error) => {
    // If this is a minimum length validation error, and the field is required,
    // then ignore it if it is currently undefined or an empty string...
    if (error.name === "minLength") {
      const propPath = errorPropertyToPath(error.property);
      // The prop name is at the end of the path
      const propName = propPath.pop();
      // Note that we're getting the path to the parent schema by popping the 
      // property off the end of the path
      const propParentPath = propPath;
      // If the path starts with instance, then remove it, since we're beginning
      // from the root schema... 
      if (propParentPath[0] === "instance") {
        propParentPath.shift();
      }
      const propParentSchema = propParentPath.reduce((parent, prop) => {
        if (typeof prop === "number") {
          return parent.items;
        }
        return parent.properties[prop];
      }, schema);
      if (propParentSchema.required && propParentSchema.required.indexOf(propName) > -1
        && (!error.instance || error.instance.length === 0)) {
        return false;
      }
    }
    return true;
  }).map((error) => {
    // If this is a required property error for an object, then
    // re-frame the validation error as a 'Field is required' 
    // error for the specified property...
    if (error.name === "required") {
      error.property += "." + error.argument;
      error.message = error.schema.properties[error.argument].title + " is required";
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
    // jsonschema validator, capitalize the first letter and add a period
    // at the end for nicer formatting...
    else {
      error.message = error.message.charAt(0).toUpperCase() + error.message.slice(1) + ".";
    }
    // Format error stack message to format: "[Prop Title]: Error Message"
    error.stack = error.schema.title + ": " + error.message;
    return error;
  });
  return Object.assign({}, jsonValidateResult, {
    errors: newErrors.concat(extValidationErrors)
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
