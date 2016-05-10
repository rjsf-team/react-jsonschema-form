import { validate as jsonValidate } from "jsonschema";

import { isObject, mergeObjects } from "./utils";


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
      // "errors" (see `createErrorHandler`).
      parent.__errors = parent.__errors.concat(message);
    } else {
      parent.__errors = [message];
    }
    return errorSchema;
  }, {});
}

export function toErrorList(errorSchema) {
  return Object.keys(errorSchema).reduce((acc, key) => {
    const field = errorSchema[key];
    if ("__errors" in field) {
      // XXX: We should transform key as a full field path string.
      acc = acc.concat(field.__errors.map(stack => ({stack: `${key} ${stack}`})));
    } else if (isObject(field)) {
      acc = acc.concat(toErrorList(field));
    }
    return acc;
  }, []);
}

function createErrorHandler(formData) {
  const handler = {
    // We store the list of errors for this node in a property named __errors
    // to avoid name collision with a possible sub schema field named
    // "errors" (see `toErrorSchema`).
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
 * This function processes the formData against:
 *
 * 1. A JSON schema object, then
 * 2. An optional `validate` contributed function, which receives the form data
 * and an `errorHandler` object used to add custom validation errors for each
 * field.
 *
 * It returns a Promise resolving with an object exposing the following
 * properties:
 *
 * - `errors`: The list of encountered validation errors;
 * - `errorSchema`: An error tree matching the formData structure.
 *
 * @return {Promise}
 */
export default function validateFormData(formData, schema, customValidate) {
  const {errors} = jsonValidate(formData, schema);
  const errorSchema = toErrorSchema(errors);

  if (typeof customValidate !== "function") {
    return Promise.resolve({errors, errorSchema});
  }

  const errorHandler = createErrorHandler(formData);
  return Promise.resolve(customValidate(formData, errorHandler))
    .then(userErrorHandler => {
      const userErrorSchema = unwrapErrorHandler(userErrorHandler);
      const newErrorSchema = mergeObjects(errorSchema, userErrorSchema, true);
      // XXX: The errors list produced is not fully compliant with the format
      // exposed by the jsonschema lib, which contains full field paths and other
      // properties.
      const newErrors = toErrorList(newErrorSchema);
      return {errors: newErrors, errorSchema: newErrorSchema};
    });
}
