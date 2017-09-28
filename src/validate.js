import toPath from "lodash.topath";
import Ajv from "ajv";
const ajv = new Ajv({ errorDataPath: "property" });
ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
// custom format used by this lib
ajv.addFormat(
  "data-url",
  /^\s*data:([a-z]+\/[a-z0-9\-\+]+(;[a-z\-]+\=[a-z0-9\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i
);

import { isObject, mergeObjects } from "./utils";

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
    const { property, message } = error;
    const path = toPath(property);
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
    errorList = errorList.concat(
      errorSchema.__errors.map(stack => {
        return {
          stack: `${fieldName}: ${stack}`
        };
      })
    );
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
    }
  };
  if (isObject(formData)) {
    return Object.keys(formData).reduce((acc, key) => {
      return { ...acc, [key]: createErrorHandler(formData[key]) };
    }, handler);
  }
  if (Array.isArray(formData)) {
    return formData.reduce((acc, value, key) => {
      return { ...acc, [key]: createErrorHandler(value) };
    }, handler);
  }
  return handler;
}

function unwrapErrorHandler(errorHandler) {
  return Object.keys(errorHandler).reduce((acc, key) => {
    if (key === "addError") {
      return acc;
    } else if (key === "__errors") {
      return { ...acc, [key]: errorHandler[key] };
    }
    return { ...acc, [key]: unwrapErrorHandler(errorHandler[key]) };
  }, {});
}

/**
 * Transforming the error output from ajv to expected format from previous
 * json schema validation library.
 * @param {*} errors 
 */
function transformAjvErrors(errors = []) {
  if (errors === null) {
    return [];
  }

  // filtering out oneOf and enum. Not sure how to handle those in UI
  return errors
    .filter(e => e.keyword !== "oneOf" && e.keyword !== "enum")
    .map(e => {
      const { dataPath, keyword, message } = e;
      let property = `instance${dataPath}`;

      if (keyword === "oneOf" || keyword === "enum") {
        return;
      }

      // put data in expected format
      return {
        name: keyword,
        property,
        message,
        stack: `${dataPath} ${message}`
      };
    });
}

/**
 * This function processes the formData with a user `validate` contributed
 * function, which receives the form data and an `errorHandler` object that
 * will be used to add custom validation errors for each field.
 */
export default function validateFormData(
  formData,
  schema,
  customValidate,
  transformErrors
) {
  let errors = [];

  ajv.validate(schema, formData);
  errors = transformAjvErrors(ajv.errors);

  if (typeof transformErrors === "function") {
    errors = transformErrors(errors);
  }
  const errorSchema = toErrorSchema(errors);

  if (typeof customValidate !== "function") {
    return { errors, errorSchema };
  }

  const errorHandler = customValidate(formData, createErrorHandler(formData));
  const userErrorSchema = unwrapErrorHandler(errorHandler);
  const newErrorSchema = mergeObjects(errorSchema, userErrorSchema, true);
  // XXX: The errors list produced is not fully compliant with the format
  // exposed by the jsonschema lib, which contains full field paths and other
  // properties.
  const newErrors = toErrorList(newErrorSchema);

  return { errors: newErrors, errorSchema: newErrorSchema };
}
