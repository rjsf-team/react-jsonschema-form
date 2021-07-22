import toPath from "lodash/toPath";
import Ajv from "ajv";
let ajv;
let previousSchema;
let previousMetaSchemas;
let previousFormats;
import { deepEquals, getDefaultFormState } from "./utils";

const ROOT_SCHEMA_PREFIX = "__rjsf_rootSchema";

import { isObject, mergeObjects } from "./utils";
import memoize from "lodash/memoize";

function createAjvInstance() {
  const ajv = new Ajv({
    errorDataPath: "property",
    allErrors: true,
    multipleOfPrecision: 8,
    schemaId: "auto",
    unknownFormats: "ignore",
    useDefaults: true,
  });

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
    const path = toPath(property);
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
  if (errors === null) {
    return [];
  }

  return errors.map(e => {
    const { dataPath, keyword, message, params, schemaPath } = e;
    let property = `${dataPath}`;

    // put data in expected format
    return {
      name: keyword,
      property,
      message,
      params, // specific to ajv
      stack: `${property} ${message}`.trim(),
      schemaPath,
    };
  });
}

let validate;
let compileError;
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

  const schemaChanged = !deepEquals(previousSchema, schema);
  const metaSchemasChanged = !deepEquals(
    previousMetaSchemas,
    additionalMetaSchemas
  );
  const formatsChanged = !deepEquals(previousFormats, customFormats);

  if (
    validate == null ||
    schemaChanged ||
    metaSchemasChanged ||
    formatsChanged
  ) {
    compileError = null;
    previousSchema = schema;
    previousMetaSchemas = additionalMetaSchemas;
    previousFormats = customFormats;
    ajv = createAjvInstance();

    // add more schemas to validate against
    if (additionalMetaSchemas && Array.isArray(additionalMetaSchemas)) {
      ajv.addMetaSchema(additionalMetaSchemas);
    }

    // add more custom formats to validate against
    if (customFormats && isObject(customFormats)) {
      Object.keys(customFormats).forEach(formatName => {
        ajv.addFormat(formatName, customFormats[formatName]);
      });
    }
    try {
      validate = ajv.compile(schema);
    } catch (e) {
      compileError = e;
    }
  }

  let errors;
  if (!compileError) {
    validate(formData);
    errors = transformAjvErrors(validate.errors);
  } else {
    errors = transformAjvErrors(ajv.errors);
  }

  const noProperMetaSchema =
    compileError &&
    compileError.message &&
    typeof compileError.message === "string" &&
    compileError.message.includes("no schema with key or ref ");

  if (noProperMetaSchema) {
    errors = [
      ...errors,
      {
        stack: compileError.message,
      },
    ];
  }
  if (typeof transformErrors === "function") {
    errors = transformErrors(errors);
  }

  let errorSchema = toErrorSchema(errors);

  if (noProperMetaSchema) {
    errorSchema = {
      ...errorSchema,
      ...{
        $schema: {
          __errors: [compileError.message],
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
function _withIdRefPrefix(schemaNode) {
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

// Convert all arguments to one long string. This can be expensive with multiple, large objects, so use sparingly
const cacheKeyFn = (...args) => args.map(arg => JSON.stringify(arg)).join("_");

/**
 * _withIdRefPrefix creates a new schema object every time it runs, which prevents us from utilizing AJV's cache, triggering a compile every run
 * We can memoize the function to reuse schemas that we've already resolved, which lets us hit AJV's cache and avoid expensive recompiles
 */
export const withIdRefPrefix = memoize(_withIdRefPrefix, cacheKeyFn);

let compiledSubschemaMap = new WeakMap();
let withIdRefPrefixMap = new WeakMap();
/**
 * Validates data against a schema, returning true if the data is valid, or
 * false otherwise. If the schema is invalid, then this function will return
 * false.
 */
export function isValid(schema, data, rootSchema) {
  try {
    let subschemaAjv;
    if (compiledSubschemaMap.has(rootSchema)) {
      subschemaAjv = compiledSubschemaMap.get(rootSchema);
    } else {
      // add the rootSchema, using the ROOT_SCHEMA_PREFIX as the cache key.

      subschemaAjv = createAjvInstance();
      subschemaAjv.addSchema(rootSchema, ROOT_SCHEMA_PREFIX);
      compiledSubschemaMap.set(rootSchema, subschemaAjv);
    }

    // rewrite the schema ref's to point to the rootSchema
    // this accounts for the case where schema have references to models
    // that lives in the rootSchema but not in the schema in question.
    let prefixedSchema;
    if (withIdRefPrefixMap.has(schema)) {
      prefixedSchema = withIdRefPrefixMap.get(schema);
    } else {
      prefixedSchema = _withIdRefPrefix(schema);
      withIdRefPrefixMap.set(schema, prefixedSchema);
    }

    return subschemaAjv.validate(prefixedSchema, data);
  } catch (e) {
    console.warn("Encountered error while validating schema", e);
    return false;
  }
}
