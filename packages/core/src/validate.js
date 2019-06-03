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

function orderErrorsByUiSchema(uiSchema, _errors, _errorSchema) {
  console.log("");
  console.log("calling orderErrorsByUiSchema");
  console.log(998, _errors);
  console.log(999, _errorSchema);

  const errorsWithFlattenedPath = {};
  const flattenErrorSchema = (errorSchema, currentPath = "") => {
    Object.entries(errorSchema).forEach(([schemaKey, schemaValue]) => {
      if (Array.isArray(schemaValue)) {
        // we found the __errors array
        // find the error in _errors for this path
        const pathWithoutErrorsArray = currentPath
          .split(".")
          .filter(x => x !== "__errors");
        errorsWithFlattenedPath[currentPath] = _errors.filter(e => {
          return (
            e.property ===
            `.${pathWithoutErrorsArray.reduce(
              (acc, curVal) =>
                `${acc}${
                  e.property.includes(`[${curVal}]`)
                    ? `[${curVal}]`
                    : `.${curVal}`
                }`
            )}`
          );
        });
      } else {
        // we did not find the __errors array, yet. Let's go deeper
        let nextLevelPath;
        if (
          _errors.some(err =>
            err.property.includes(`${currentPath}[${schemaKey}]`)
          )
        ) {
          // array!
          nextLevelPath = `${currentPath}[${schemaKey}]`;
        } else {
          nextLevelPath = [currentPath, schemaKey].filter(x => !!x).join(".");
        }
        /*console.log(
          `going from (${currentPath}) with (${schemaKey}) into ${nextLevelPath}`
        );*/
        flattenErrorSchema(schemaValue, nextLevelPath);
      }
    });
  };
  flattenErrorSchema(_errorSchema);

  console.log("");
  console.log(
    4242,
    "outcome of creating the errorsWithFlattenedPath: ",
    errorsWithFlattenedPath,
    88854
  );

  const orderedErrors = [];

  const addErrorsForNode = (uiSchemaNode, currentPath = ".") => {
    const currentNodeUiOrder = uiSchemaNode["ui:order"];
    if (currentNodeUiOrder) {
      // there is an ui order here
      currentNodeUiOrder.forEach(propInOrder => {
        const getPropInOrderPath = () =>
          [
            currentPath
              .split(".")
              .filter(x => !!x)
              .join("."),
            propInOrder,
          ]
            .filter(x => !!x)
            .join(".");

        // TODO check for *
        const currentErrorPath = getPropInOrderPath();
        const errorForThisProp = errorsWithFlattenedPath[currentErrorPath];
        /*
        console.log(
          `we are looking at uiOrder prop (${propInOrder}) in path (${currentErrorPath})`,
          errorForThisProp,
          currentPath,
          1133
        );*/
        // TODO see if there are errors in errorsWithFlattenedPath that match currentErrorPath{somenumber}.propInOrder

        if (errorForThisProp) {
          // there is an error for this exact path
          // console.log('there is an error for this exact path!!!!!', errorForThisProp)
          if (!orderedErrors.includes(errorForThisProp)) {
            // it's not in the orderer errors so we add it
            orderedErrors.push(errorForThisProp);
          }
          // we don't want to stop adding the errors for this property (maybe it's a list with minItems and there are errors in the nested children)
          const flattenedErrosWithCurrentErrorPath = Object.entries(
            errorsWithFlattenedPath
          ).filter(([errPath]) => errPath.startsWith(`${currentErrorPath}[`));
          console.log("xD", flattenedErrosWithCurrentErrorPath);
          flattenedErrosWithCurrentErrorPath.forEach(([errPath]) => {
            // there in an error in this array so we want to go through them one by one and add them individually
            addErrorsForNode(
              uiSchemaNode[propInOrder],
              errPath.substring(0, errPath.lastIndexOf("."))
            );
          });
        } else {
          // there is no error for this uiorder field, we try to go deeper
          if (uiSchemaNode[propInOrder]) {
            console.log(`1 going into with ${currentErrorPath}`);
            const flattenedErrosWithCurrentErrorPath = Object.entries(
              errorsWithFlattenedPath
            ).filter(([errPath]) => errPath.startsWith(`${currentErrorPath}[`));
            console.log("xD", flattenedErrosWithCurrentErrorPath);
            flattenedErrosWithCurrentErrorPath.forEach(([errPath]) => {
              // there in an error in this array so we want to go through them one by one and add them individually
              addErrorsForNode(
                uiSchemaNode[propInOrder],
                errPath.substring(0, errPath.lastIndexOf("."))
              );
            });

            // TODO call new function to order it for error array?
            // TODO iterate over all errors to see if there are errors for this array, then call addErrorsForNode for every error
            addErrorsForNode(uiSchemaNode[propInOrder], getPropInOrderPath());
          } else {
            console.log("heawhehaw", currentErrorPath);
            // there's no error for this exact prop, but maybe it's an array
            // console.log('xaxaxa', currentPath, currentErrorPath, errorsWithFlattenedPath);
            const errorsThatStartWithThisPath = _errors.filter(err => {
              // console.log(`iterating over the errors to see if the err property (${err.property}) starts with (${`.${currentErrorPath}[`})`, err.property.startsWith(`.${currentErrorPath}[`));
              return err.property.startsWith(`.${currentErrorPath}[`);
            });
            // console.log('there are errors that start with this path!!!!!', currentErrorPath, errorsThatStartWithThisPath, 77, orderedErrors)
            errorsThatStartWithThisPath
              .filter(er => !orderedErrors.includes(er))
              .forEach(er => orderedErrors.push(er));
          }
        }
      });
    } else {
      // find errors on the current level
      const errorsOnTheCurrentPath = _errors.filter(err =>
        err.property.startsWith(err.property)
      );
      errorsOnTheCurrentPath.forEach(e => {
        const pathForProblematicThing = e.property.substring(
          e.property.indexOf(currentPath) + 1
        );
        const pathFor = pathForProblematicThing.substring(
          0,
          pathForProblematicThing.indexOf(".")
        );
        // is there a prop in the uiSchema for this? -> go deeper
        if (uiSchemaNode[pathFor]) {
          // the uiSchema node has a property for this ui:order element! Maybe it has an uiOrder itself
          // console.log(`going into 2 with ${`.${pathFor}`}`);

          addErrorsForNode(uiSchemaNode[pathFor], `.${pathFor}`);
        } else {
          // there is no property for this element in the current uiSchema so we simply add it to this position
          orderedErrors.push(e);
        }
      });
    }

    // go deeper
    Object.entries(uiSchemaNode).forEach(([k, v]) => {
      if (typeof v === "object" && !Array.isArray(v)) {
        // console.log(`going into 2 with ${`${currentPath}${k}`}`);
        addErrorsForNode(v, `${currentPath}${k}`);
      }
    });
  };

  addErrorsForNode(uiSchema);

  // flatten thing
  const flattened = [].concat(...orderedErrors);
  console.log();
  console.log("outcome of the sorting: ", flattened, "hehe", flattened.length);
  return flattened;
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
    console.log("he ho onetwothree", errors);
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

  const orderedNewErrors = orderErrorsByUiSchema(
    uiSchema,
    newErrors,
    errorSchema
  );

  return {
    errors: orderedNewErrors,
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
