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
 * Recursively searches through the _errorSchema to find all `__errors` entries.
 * When one is found a new property is added to the `_target` with the path to
 * this `__errors` as the key and the value of `__errors`.
 *
 * @example
 * // sample input
 * {
 *     foo: {
 *         bar: {
 *             __errors: [...__errorsOfThisProp],
 *             2: {
 *                 __errors: [...__errorsOfThisProp]
 *             }
 *         }
 *     }
 * }
 * // sample output
 * // different cases possible of an error.properties; here are some EXAMPLES
 * {
 *     ".foo": [* errors like: a -> is-required; is-not-a-string; is-not-of-type *],
 *     ".bar[n]": [* errors like: b -> is-not-an-array *],
 *     ".bar[n].qux": [* errors like: (a) *],
 *     ".bar[n].qux[4]": [* errors like: (b) *],
 *     ".bar[n].qux[4].wibble": [* errors like: (a) *],
 *     "": [* errors like: does-not-match-oneof-schema *]
 * }
 *
 * @param {object} _target - the object to add the key to.
 * @param {object[]} _errors - the errors of ajv
 * @param {object} _errorSchema - the error schema constructed by the `toErrorSchema` function
 * @param {string} _currentPath - the path of the current nested object
 */
function flattenErrorSchema(_target, _errors, _errorSchema, _currentPath = "") {
  Object.entries(_errorSchema).forEach(([schemaKey, schemaValue]) => {
    if (Array.isArray(schemaValue)) {
      // we found the __errors array
      // find the error in _errors for this path
      const pathWithoutErrorsArray = _currentPath
        .split(".")
        .filter(x => x !== "__errors");
      _target[_currentPath] = _errors.filter(
        err =>
          err.property ===
          `.${pathWithoutErrorsArray.reduce(
            (acc, curVal) =>
              `${acc}${
                err.property && err.property.includes(`[${curVal}]`)
                  ? `[${curVal}]`
                  : `.${curVal}`
              }`
          )}`
      );
    } else {
      // we did not find the __errors array, yet. Let's go deeper
      let nextLevelPath;
      if (
        _errors.some(
          err =>
            "property" in err &&
            err.property.includes(`${_currentPath}[${schemaKey}]`)
        )
      ) {
        // array!
        nextLevelPath = `${_currentPath}[${schemaKey}]`;
      } else {
        nextLevelPath = [_currentPath, schemaKey].filter(x => !!x).join(".");
      }
      flattenErrorSchema(_target, _errors, schemaValue, nextLevelPath);
    }
  });
}

/**
 * sorting based on flattened _errorSchema
 *
 * @param _uiSchema
 * @param _errors
 * @param _errorSchema
 * @return {Array}
 */
function orderErrorsByUiSchema(_uiSchema, _errors, _errorSchema) {
  if (!Array.isArray(_errors) || _errors.length === 0) {
    return [];
  }
  console.log(`in`, _errorSchema);
  const flattenedErrorSchema = {};
  flattenErrorSchema(flattenedErrorSchema, _errors, _errorSchema);
  console.log(`out`, flattenedErrorSchema);
  const orderedErrors = [];

  const addIfAbsent = errorToAdd => {
    if (!orderedErrors.includes(errorToAdd)) {
      orderedErrors.push(errorToAdd);
    }
  };

  const addErrorsForNode = (uiSchemaNode, currentErrorPath = ".") => {
    const currentNodeUiOrder = uiSchemaNode["ui:order"];
    if (currentNodeUiOrder) {
      // there is an ui order here
      currentNodeUiOrder.forEach(propInCurrentUiOrder => {
        // TODO check
        const constructPathOfPropInCurrentUiOrder = () =>
          [
            currentErrorPath
              .split(".")
              .filter(x => !!x)
              .join("."),
            propInCurrentUiOrder,
          ]
            .filter(x => !!x)
            .join(".");

        const uiSchemaNodeofPropInOrder = uiSchemaNode[propInCurrentUiOrder];
        const pathOfPropInOrder = constructPathOfPropInCurrentUiOrder();
        const errorForThisProp = flattenedErrorSchema[pathOfPropInOrder];
        const errForCurrentPath = flattenedErrorSchema[currentErrorPath];
        if (errForCurrentPath) {
          // there is an error for this exact path
          errForCurrentPath.forEach(addIfAbsent);
        }

        if (errorForThisProp) {
          // there is property in the current _uiSchema node for this ui:order element
          errorForThisProp.forEach(addIfAbsent);

          const flattenedArrayErrosWithCurrentErrorPath = Object.entries(
            flattenedErrorSchema
          ).filter(([errPath]) => errPath.startsWith(`${pathOfPropInOrder}[`));

          // we don't want to stop adding the errors for this property (maybe it's a list with minItems and there are errors in the nested children)
          flattenedArrayErrosWithCurrentErrorPath.forEach(([errPath]) => {
            // there in an error in this array so we want to go through them one by one and add them individually
            if (uiSchemaNodeofPropInOrder) {
              addErrorsForNode(
                uiSchemaNodeofPropInOrder,
                errPath.substring(0, errPath.lastIndexOf("."))
              );
            }
          });
        }

        if (uiSchemaNodeofPropInOrder) {
          // there is no error on this level of the _uiSchema, but the error prop itself has an _uiSchema prop -> we dive in...
          const flattenedArrayErrosWithCurrentErrorPath = Object.entries(
            flattenedErrorSchema
          ).filter(([errPath]) => errPath.startsWith(`${pathOfPropInOrder}[`));
          flattenedArrayErrosWithCurrentErrorPath.forEach(([errPath]) => {
            // there in an error in this array so we want to go through them one by one and add them individually
            addErrorsForNode(
              uiSchemaNodeofPropInOrder,
              errPath.substring(0, errPath.lastIndexOf("."))
            );
          });

          addErrorsForNode(
            uiSchemaNodeofPropInOrder,
            pathOfPropInOrder.startsWith(".")
              ? pathOfPropInOrder
              : `.${pathOfPropInOrder}`
          );
        }

        if (
          _errors.some(err => err.property.startsWith(`.${pathOfPropInOrder}[`))
        ) {
          // there are array errors for this property
          _errors
            .filter(err => err.property.startsWith(`.${pathOfPropInOrder}[`))
            .forEach(addIfAbsent);
        }

        if (propInCurrentUiOrder === "*") {
          // find errors on current path
          // find errors that are not in the current paths uiorder

          // 1. find errors on current path
          const errorsOnTheCurrentPath = _errors.filter(
            err =>
              err.property.startsWith(currentErrorPath) &&
              err.property !== currentErrorPath
          );
          const errorsThatAreTheCurrentPath = _errors.filter(
            err => err.property === currentErrorPath
          );

          errorsThatAreTheCurrentPath.forEach(addIfAbsent);

          // filter out errors which are mentioned in the _uiSchema
          const errorsNotMentionedInUiOrder = errorsOnTheCurrentPath.filter(
            err => {
              // property name of next thing
              const { property: errProp } = err;

              const propertyNameOfNextLevelAfterCurrentPath = errProp
                .replace(currentErrorPath, "")
                .replace(/(\[|\.]).*$/gm, "");

              const uiSchemaNodeProperty = propertyNameOfNextLevelAfterCurrentPath.startsWith(
                "."
              )
                ? propertyNameOfNextLevelAfterCurrentPath.substring(1)
                : propertyNameOfNextLevelAfterCurrentPath;

              return (
                uiSchemaNodeProperty !== "" &&
                !currentNodeUiOrder.includes(uiSchemaNodeProperty)
              );
            }
          );
          // call addErrorsForNode for each error
          errorsNotMentionedInUiOrder.forEach(err => {
            const propertyNameOfNextLevelAfterCurrentPath = err.property
              .replace(currentErrorPath, "")
              .replace(/(\[|\.]).*$/gm, "");

            const uiSchemaNodeProperty = propertyNameOfNextLevelAfterCurrentPath.startsWith(
              "."
            )
              ? propertyNameOfNextLevelAfterCurrentPath.substring(1)
              : propertyNameOfNextLevelAfterCurrentPath;

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
              addErrorsForNode(uiSchemaNodeForProp, nextCurrentPath);
            } else {
              addIfAbsent(err);
            }
          });
        }
      });
    } else {
      const errsOnTheCurrentLevel = _errors.filter(
        err => "property" in err && err.property.startsWith(currentErrorPath)
      );

      errsOnTheCurrentLevel.forEach(err => {
        const errorPropertyWithoutCurrentErrorPath = err.property.replace(
          currentErrorPath,
          ""
        );

        const nextUiSchemaProperty = errorPropertyWithoutCurrentErrorPath.includes(
          "."
        )
          ? errorPropertyWithoutCurrentErrorPath.substring(
              0,
              errorPropertyWithoutCurrentErrorPath.indexOf(".")
            )
          : "";

        // is there a prop in the _uiSchema for this? -> go deeper
        let nextUiSchemaNode;
        if (nextUiSchemaProperty.endsWith("]")) {
          nextUiSchemaNode =
            uiSchemaNode[
              nextUiSchemaProperty.substring(
                0,
                nextUiSchemaProperty.indexOf("[")
              )
            ];
        } else {
          nextUiSchemaNode = uiSchemaNode[nextUiSchemaProperty];
        }
        if (nextUiSchemaNode) {
          // the _uiSchema node has a property for this ui:order element! Maybe it has an ui:order itself so we go deeper
          addErrorsForNode(nextUiSchemaNode, `.${nextUiSchemaProperty}`);
        } else {
          // there is no property for this element in the current _uiSchema so we simply add it to this position
          addIfAbsent(err);
        }
      });
    }
  };

  addErrorsForNode(_uiSchema);

  // adding errors that were not possible to sort
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
  customFormats = {},
  uiSchema = {}
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
    const orderedErrors = orderErrorsByUiSchema(uiSchema, errors, errorSchema);
    return { errors: orderedErrors, errorSchema };
  }

  const errorHandler = customValidate(formData, createErrorHandler(formData));
  const userErrorSchema = unwrapErrorHandler(errorHandler);
  const newErrorSchema = mergeObjects(errorSchema, userErrorSchema, true);
  // XXX: The errors list produced is not fully compliant with the format
  // exposed by the jsonschema lib, which contains full field paths and other
  // properties.
  const newErrors = toErrorList(newErrorSchema);

  const orderedErrors = orderErrorsByUiSchema(
    uiSchema,
    newErrors,
    newErrorSchema
  );

  return {
    errors: orderedErrors,
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
