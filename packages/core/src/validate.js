import toPath from "lodash/toPath";
import Ajv from "ajv";
import addFormats from "ajv-formats";
let ajv = createAjvInstance();
import { deepEquals, getDefaultFormState } from "./utils";

let formerCustomFormats = null;
let formerMetaSchema = null;
const ROOT_SCHEMA_PREFIX = "__rjsf_rootSchema";

import { isObject, mergeObjects } from "./utils";

function createAjvInstance() {
  const ajv = new Ajv({
    allErrors: true,
    multipleOfPrecision: 8,
    strictTypes: "log",
  });

  // Populate all standard formats from ajv-formats
  addFormats(ajv);

  // add custom formats
  ajv.addFormat(
    "data-url",
    /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/
  );
  ajv.addFormat(
    "color",
    /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/
  );
  return ajv;
}

/**
 * Transform property into object paths that can be used to generate errorSchema.
 * 'property' has the format of dataPath from ajv errors. This function transforms it
 * as follows:
 *  /topLevel/child        -->    ["", "topLevel", "child"]
 *  /topLevel/with.Dot     -->    ["", "topLevel", "with.Dot"]
 *  /topLevel/with/Slash   -->    ["", "topLevel", "with~Slash"]
 * @param {string} property source of error in the data.
 * @returns {stringp[]} array of object paths.
 */
function genPaths(property) {
  if (property === null || property === undefined) {
    return [];
  }
  const replaceDots = property.replace(/\./g, "~~");
  const replaceSlash = replaceDots.replace(/\//g, ".");
  const paths = toPath(replaceSlash);

  const formatedPaths = paths.map(path => {
    return path.replace(/~~/g, ".");
  });

  return formatedPaths;
}

function toErrorSchema(errors) {
  // Transforms a ajv validation errors list:
  // [
  //   {property: ".level1.level2[2].level3", message: "err a"},
  //   {property: ".level1.level2[2].level3", message: "err b"},
  //   {property: ".level1.level2[4].level3", message: "err b"},
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
    const path = genPaths(property);
    let parent = errorSchema;

    // If the property is at the root (.level1) then toPath creates
    // an empty array element at the first index. Remove it.
    if (path.length > 0 && path[0] === "") {
      path.splice(0, 1);
    }

    for (const segment of path.slice(0)) {
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
      if (message) {
        parent.__errors = [message];
      }
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
          stack: `${fieldName}: ${stack}`,
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
    },
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
 * Transforming the error output from ajv to format used by jsonschema.
 * At some point, components should be updated to support ajv.
 */
function transformAjvErrors(errors = []) {
  if (errors === null || errors === undefined) {
    return [];
  }

  return errors.map(e => {
    const { dataPath, keyword, message, params, schemaPath } = e;

    // ajv@7^ does not provide a field name that failed validation for
    // required fields in an object. We extract the field name and add
    // it back to the dataPath so we can pinpoint the field that caused
    // the error and accordingly generate error schema.
    let fixedDataPath = dataPath;
    let fixedMessage = message;
    if (keyword === "required" && params.missingProperty) {
      fixedDataPath += "/" + params.missingProperty;
      fixedMessage = "is a required property";
    }
    let property = `${fixedDataPath}`;
    // put data in expected format
    return {
      name: keyword,
      property,
      message: fixedMessage,
      params, // specific to ajv
      stack: `${property} ${fixedMessage}`.trim(),
      schemaPath,
    };
  });
}

/**
 * Determine whether errors thrown by AJV should be included in
 * the error messages.
 * @returns {boolean} true if error messages should be included.
 */
function shouldIncludeSchemaErrors(error) {
  if (!error || !error.message || typeof error.message !== "string") {
    return false;
  }
  if (
    error.message.includes("no schema with key or ref ") ||
    error.message.includes("required value must be ") ||
    error.message.includes("schema is invalid")
  ) {
    return true;
  }

  return false;
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
  transformErrors,
  additionalMetaSchemas = [],
  customFormats = {}
) {
  // Include form data with undefined values, which is required for validation.
  const rootSchema = schema;
  formData = getDefaultFormState(schema, formData, rootSchema, true);

  const newMetaSchemas = !deepEquals(formerMetaSchema, additionalMetaSchemas);
  const newFormats = !deepEquals(formerCustomFormats, customFormats);

  if (newMetaSchemas || newFormats) {
    ajv = createAjvInstance();
  }

  // add more schemas to validate against
  if (
    additionalMetaSchemas &&
    newMetaSchemas &&
    Array.isArray(additionalMetaSchemas)
  ) {
    ajv.addMetaSchema(additionalMetaSchemas);
    formerMetaSchema = additionalMetaSchemas;
  }

  // add more custom formats to validate against
  if (customFormats && newFormats && isObject(customFormats)) {
    Object.keys(customFormats).forEach(formatName => {
      ajv.addFormat(formatName, customFormats[formatName]);
    });

    formerCustomFormats = customFormats;
  }

  let validationError = null;

  // Since ajv@7, schema validation is not automatically performed every time
  // when validating data, so we explicitly check for schema errors first.
  try {
    ajv.validateSchema(schema);
  } catch (err) {
    validationError = err;
  }

  if (validationError === null) {
    try {
      ajv.validate(schema, formData);
    } catch (err) {
      validationError = err;
    }
  }

  let errors = transformAjvErrors(ajv.errors);
  // Clear errors to prevent persistent errors, see #1104

  ajv.errors = null;

  const includeValidationErrors = shouldIncludeSchemaErrors(validationError);

  if (includeValidationErrors) {
    errors = [
      ...errors,
      {
        stack: validationError.message,
      },
    ];
  }
  if (typeof transformErrors === "function") {
    errors = transformErrors(errors);
  }

  let errorSchema = toErrorSchema(errors);

  if (includeValidationErrors) {
    errorSchema = {
      ...errorSchema,
      ...{
        $schema: {
          __errors: [validationError.message],
        },
      },
    };
  }

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

  return {
    errors: newErrors,
    errorSchema: newErrorSchema,
  };
}

/**
 * Recursively prefixes all $ref's in a schema with `ROOT_SCHEMA_PREFIX`
 * This is used in isValid to make references to the rootSchema
 */
export function withIdRefPrefix(schemaNode) {
  let obj = schemaNode;
  if (schemaNode.constructor === Object) {
    obj = { ...schemaNode };
    for (const key in obj) {
      const value = obj[key];
      if (
        key === "$ref" &&
        typeof value === "string" &&
        value.startsWith("#")
      ) {
        obj[key] = ROOT_SCHEMA_PREFIX + value;
      } else {
        obj[key] = withIdRefPrefix(value);
      }
    }
  } else if (Array.isArray(schemaNode)) {
    obj = [...schemaNode];
    for (var i = 0; i < obj.length; i++) {
      obj[i] = withIdRefPrefix(obj[i]);
    }
  }
  return obj;
}

/**
 * Validates data against a schema, returning true if the data is valid, or
 * false otherwise. If the schema is invalid, then this function will return
 * false.
 */
export function isValid(schema, data, rootSchema) {
  try {
    // add the rootSchema ROOT_SCHEMA_PREFIX as id.
    // then rewrite the schema ref's to point to the rootSchema
    // this accounts for the case where schema have references to models
    // that lives in the rootSchema but not in the schema in question.
    return ajv
      .addSchema(rootSchema, ROOT_SCHEMA_PREFIX)
      .validate(withIdRefPrefix(schema), data);
  } catch (e) {
    return false;
  } finally {
    // make sure we remove the rootSchema from the global ajv instance
    ajv.removeSchema(ROOT_SCHEMA_PREFIX);
  }
}
