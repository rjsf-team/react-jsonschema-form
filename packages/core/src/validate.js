import toPath from "lodash/toPath";
import Ajv from "ajv";

let ajv = createAjvInstance();
import { deepEquals, getDefaultFormState } from "./utils";

let formerCustomFormats = null;
let formerMetaSchema = null;

import { isObject, mergeObjects } from "./utils";

function createAjvInstance() {
  const ajv = new Ajv({
    errorDataPath: "property",
    allErrors: true,
    multipleOfPrecision: 8,
    schemaId: "auto",
    unknownFormats: "ignore",
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

/**
 * Iterates over all {_errors} to create an object containing properties with the
 * error property as the key and all errors for this error property as the value
 *
 * @example
 * // sample ajv _errors input
 * [
 *    {property: '.foo', ...errorForThisProp},
 *    {property: '.bar', ...errorForThisProp},
 *    {property: '.bar[2]', ...errorForThisProp},
 *    {property: '.bar[2].qux', ...errorForThisProp},
 *    {property: '.bar', ...errorForThisProp}
 *    {property: '', ...errorForThisProp}
 * ]
 * // sample output
 * // different cases possible for error.properties; here are some examples
 * {
 *     ".foo": [* all errors for this prop *],
 *     ".bar[n]": [* all errors for this prop *],
 *     ".bar[n].qux": [* all errors for this prop *],
 *     ".bar[n].qux[4]": [* all errors for this prop *],
 *     ".bar[n].qux[4].wibble": [* all errors for this prop *],
 *     ".bax.2": [* all errors for this prop *],
 *     "": [* all errors for this prop *]
 * }
 *
 * @param {object[]} _errors - the errors of ajv
 */
function accumulatePropertyErrors(_errors) {
  const flattenedErrorSchema = {};
  const allErrorKeysWithoutDuplicates = [
    ...new Set(_errors.map(err => err.property)),
  ];
  allErrorKeysWithoutDuplicates.forEach(errKey => {
    const errPropKey =
      errKey && errKey.startsWith(".") ? errKey.substring(1) : errKey;
    flattenedErrorSchema[errPropKey] = _errors.filter(
      err => err.property === errKey
    );
  });
  return flattenedErrorSchema;
}

function removeDotPrefixFromString(string) {
  return string.startsWith(".") ? string.substring(1) : string;
}

function addErrorToArrayIfAbsent(array) {
  return function(error) {
    if (!array.includes(error)) {
      array.push(error);
    }
  };
}

function getErrorSchemaPathOfPropInCurrentOrder(
  currentErrorPath,
  propInCurrentUiOrder
) {
  return [
    ...currentErrorPath.split(".").filter(pathProp => !!pathProp),
    propInCurrentUiOrder,
  ].join(".");
}

function filterErrorsByUnmentionedUiorder(
  currentErrorPath,
  uiSchemaNodeProperty,
  currentNodeUiOrder
) {
  return function(err) {
    // property name of next thing
    const { property: errProp } = err;

    const propertyNameOfNextLevelAfterCurrentPath = errProp
      .replace(currentErrorPath, "")
      .replace(/(\[|\.]).*$/gm, "");

    const uiSchemaNodeProperty = removeDotPrefixFromString(
      propertyNameOfNextLevelAfterCurrentPath
    );
    return (
      uiSchemaNodeProperty !== "" &&
      !currentNodeUiOrder.includes(uiSchemaNodeProperty)
    );
  };
}

function filterErrorsOnCurrentLevel(currentErrorPath) {
  return function(err) {
    return (
      "property" in err &&
      (err.property === currentErrorPath ||
        err.property.startsWith(
          currentErrorPath === "." ? currentErrorPath : `${currentErrorPath}.`
        ))
    );
  };
}

function getNextUiSchemaProperty(errorProperty) {
  if (errorProperty.includes(".")) {
    return errorProperty.substring(0, errorProperty.indexOf("."));
  } else {
    return "";
  }
}

function handleUiOrderWildcard(
  errors,
  propertiesAndTheirErrors,
  orderedErrors,
  uiSchemaNode,
  currentErrorPath,
  uiSchemaNodeOfPropInOrder,
  currentNodeUiOrder
) {
  const errorsThatAreTheCurrentPath = errors.filter(
    err => err.property === currentErrorPath
  );
  errorsThatAreTheCurrentPath.forEach(addErrorToArrayIfAbsent(orderedErrors));

  const errorsOnTheCurrentPath = errors.filter(
    err =>
      err.property.startsWith(currentErrorPath) &&
      err.property !== currentErrorPath
  );
  // filter out errors which are not mentioned in the _uiSchema

  const errorsNotMentionedInUiOrder = errorsOnTheCurrentPath.filter(
    filterErrorsByUnmentionedUiorder(
      currentErrorPath,
      uiSchemaNodeOfPropInOrder,
      currentNodeUiOrder
    )
  );
  // call addErrorsForNode for each error
  errorsNotMentionedInUiOrder.forEach(err => {
    const propertyNameOfNextLevelAfterCurrentPath = err.property
      .replace(currentErrorPath, "")
      .replace(/(\[|\.]).*$/gm, "");

    const uiSchemaNodeProperty = removeDotPrefixFromString(
      propertyNameOfNextLevelAfterCurrentPath
    );

    let nextCurrentPathAppendix = err.property.substring(
      err.property.indexOf(uiSchemaNodeProperty)
    );

    if (nextCurrentPathAppendix.includes(".")) {
      nextCurrentPathAppendix = nextCurrentPathAppendix.substring(
        0,
        nextCurrentPathAppendix.indexOf(".")
      );
    }
    const nextCurrentPath = `${
      currentErrorPath !== "." ? currentErrorPath : ""
    }.${nextCurrentPathAppendix}`;

    const uiSchemaNodeForProp =
      uiSchemaNode[uiSchemaNodeProperty] ||
      uiSchemaNode[nextCurrentPathAppendix];

    if (uiSchemaNodeForProp) {
      recursivelyAddErrorsToArrayForNode(
        errors,
        propertiesAndTheirErrors,
        orderedErrors,
        uiSchemaNodeForProp,
        nextCurrentPath
      );
    } else {
      addErrorToArrayIfAbsent(orderedErrors)(err);
    }
  });
}

function handlePropInCurrentUiOrder(
  errors,
  propertiesAndTheirErrors,
  orderedErrors,
  uiSchemaNode,
  currentErrorPath,
  currentNodeUiOrder
) {
  return function(propInCurrentUiOrder) {
    const uiSchemaNodeOfPropInOrder = uiSchemaNode[propInCurrentUiOrder];
    const pathOfPropInOrder = getErrorSchemaPathOfPropInCurrentOrder(
      currentErrorPath,
      propInCurrentUiOrder
    );
    const errForCurrentPath = propertiesAndTheirErrors[currentErrorPath];
    if (errForCurrentPath) {
      // there is an error for this exact path
      errForCurrentPath.forEach(addErrorToArrayIfAbsent(orderedErrors));
    }
    const errorsForThisProp = propertiesAndTheirErrors[pathOfPropInOrder];
    if (errorsForThisProp) {
      // there is property in the current _uiSchema node for this ui:order element
      errorsForThisProp.forEach(addErrorToArrayIfAbsent(orderedErrors));
    }
    if (uiSchemaNodeOfPropInOrder) {
      // there is no error on this level of the _uiSchema, but the error prop itself has an _uiSchema prop -> we dive in...
      Object.entries(propertiesAndTheirErrors)
        .filter(([errPath]) => errPath.startsWith(`${pathOfPropInOrder}[`))
        .forEach(([errPath]) => {
          // there in an error in this array so we want to go through them one by one and add them individually
          recursivelyAddErrorsToArrayForNode(
            errors,
            propertiesAndTheirErrors,
            orderedErrors,
            uiSchemaNodeOfPropInOrder,
            errPath.substring(0, errPath.lastIndexOf("."))
          );
        });

      recursivelyAddErrorsToArrayForNode(
        errors,
        propertiesAndTheirErrors,
        orderedErrors,
        uiSchemaNodeOfPropInOrder,
        pathOfPropInOrder.startsWith(".")
          ? pathOfPropInOrder
          : `.${pathOfPropInOrder}`
      );
    }
    // add array errors for this exact property
    errors
      .filter(err => err.property.startsWith(`.${pathOfPropInOrder}[`))
      .forEach(addErrorToArrayIfAbsent(orderedErrors));
    if (propInCurrentUiOrder === "*") {
      // find errors that are not in the current paths ui:order since they will be handled by their ui:order sorting iteration
      handleUiOrderWildcard(
        errors,
        propertiesAndTheirErrors,
        orderedErrors,
        uiSchemaNode,
        currentErrorPath,
        uiSchemaNodeOfPropInOrder,
        currentNodeUiOrder
      );
    }
  };
}

function handleMissingUiOrderForCurrentProp(
  errors,
  propertiesAndTheirErrors,
  orderedErrors,
  uiSchemaNode,
  currentErrorPath
) {
  const errsOnTheCurrentLevel = errors.filter(
    filterErrorsOnCurrentLevel(currentErrorPath)
  );
  errsOnTheCurrentLevel.forEach(err => {
    const errorPropertyWithoutCurrentErrorPath = err.property.replace(
      currentErrorPath,
      ""
    );

    const nextUiSchemaProperty = getNextUiSchemaProperty(
      errorPropertyWithoutCurrentErrorPath
    );

    // is there a prop in the _uiSchema for this? -> go deeper
    let nextUiSchemaNode;
    if (nextUiSchemaProperty.endsWith("]")) {
      // the error is an array
      nextUiSchemaNode =
        uiSchemaNode[
          nextUiSchemaProperty.substring(0, nextUiSchemaProperty.indexOf("["))
        ];
    } else {
      nextUiSchemaNode = uiSchemaNode[nextUiSchemaProperty];
    }
    if (nextUiSchemaNode) {
      // the _uiSchema node has a property for this ui:order element! Maybe it has an ui:order itself so we go deeper
      recursivelyAddErrorsToArrayForNode(
        errors,
        propertiesAndTheirErrors,
        orderedErrors,
        nextUiSchemaNode,
        `.${nextUiSchemaProperty}`
      );
    } else {
      // there is no property for this element in the current _uiSchema so we simply add it to this position
      addErrorToArrayIfAbsent(orderedErrors)(err);
    }
  });
}

function getUiOrderFromUiSchemaNode(uiSchemaNode) {
  let uiOrder = uiSchemaNode["ui:order"];
  if (!uiOrder && "items" in uiSchemaNode) {
    uiOrder = uiSchemaNode.items["ui:order"];
  }
  return uiOrder;
}

function recursivelyAddErrorsToArrayForNode(
  errors,
  propertiesAndTheirErrors,
  orderedErrors,
  uiSchemaNode,
  currentErrorPath = "."
) {
  const currentNodeUiOrder = getUiOrderFromUiSchemaNode(uiSchemaNode);
  if (currentNodeUiOrder) {
    currentNodeUiOrder.forEach(
      handlePropInCurrentUiOrder(
        errors,
        propertiesAndTheirErrors,
        orderedErrors,
        uiSchemaNode,
        currentErrorPath,
        currentNodeUiOrder
      )
    );
  } else {
    handleMissingUiOrderForCurrentProp(
      errors,
      propertiesAndTheirErrors,
      orderedErrors,
      uiSchemaNode,
      currentErrorPath
    );
  }
}

/**
 * Sorts the ajv {_errors} by the nested ui:order structure in the {_uiSchema}.
 *
 * The first step is to combine all errors for each faulty schema property (@see {accumulatePropertyErrors}).
 * Then we recursively search through the _uiSchema to sort all errors
 * based on whatever uiSchema structure was passed in. It always tries to
 * consult the ui:orders of any nested uiSchema path for the path it is trying to sort.
 *
 * @param {object[]} _errors - the ajv errors to sort
 * @param {object} _uiSchema - the ui schema
 * @return {Array} all ajv errors in the uischema order
 */
export function sortErrorsByUiSchema(_errors, _uiSchema) {
  if (!Array.isArray(_errors) || _errors.length === 0) {
    return [];
  }
  const propertiesAndTheirErrors = accumulatePropertyErrors(_errors);
  const orderedErrors = [];
  recursivelyAddErrorsToArrayForNode(
    _errors,
    propertiesAndTheirErrors,
    orderedErrors,
    _uiSchema
  );
  // adding errors that were not possible to be sort; it normally should be able to sort everything but just in case...
  const unsortableErrors = _errors.filter(err => !orderedErrors.includes(err));
  unsortableErrors.forEach(err => orderedErrors.push(err));
  return orderedErrors;
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
  const { definitions } = schema;
  formData = getDefaultFormState(schema, formData, definitions, true);

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
  try {
    ajv.validate(schema, formData);
  } catch (err) {
    validationError = err;
  }

  let errors = transformAjvErrors(ajv.errors);
  // Clear errors to prevent persistent errors, see #1104

  ajv.errors = null;

  const noProperMetaSchema =
    validationError &&
    validationError.message &&
    typeof validationError.message === "string" &&
    validationError.message.includes("no schema with key or ref ");

  if (noProperMetaSchema) {
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

  if (noProperMetaSchema) {
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
 * Validates data against a schema, returning true if the data is valid, or
 * false otherwise. If the schema is invalid, then this function will return
 * false.
 */
export function isValid(schema, data) {
  try {
    return ajv.validate(schema, data);
  } catch (e) {
    return false;
  }
}
