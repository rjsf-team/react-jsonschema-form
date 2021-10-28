import React from "react";
import * as ReactIs from "react-is";
import mergeAllOf from "json-schema-merge-allof";
import fill from "core-js-pure/features/array/fill";
import union from "lodash/union";
import jsonpointer from "jsonpointer";
import fields from "./components/fields";
import widgets from "./components/widgets";
import validateFormData, { isValid } from "./validate";

export const ADDITIONAL_PROPERTY_FLAG = "__additional_property";

const widgetMap = {
  boolean: {
    checkbox: "CheckboxWidget",
    radio: "RadioWidget",
    select: "SelectWidget",
    hidden: "HiddenWidget",
  },
  string: {
    text: "TextWidget",
    password: "PasswordWidget",
    email: "EmailWidget",
    hostname: "TextWidget",
    ipv4: "TextWidget",
    ipv6: "TextWidget",
    uri: "URLWidget",
    "data-url": "FileWidget",
    radio: "RadioWidget",
    select: "SelectWidget",
    textarea: "TextareaWidget",
    hidden: "HiddenWidget",
    date: "DateWidget",
    datetime: "DateTimeWidget",
    "date-time": "DateTimeWidget",
    "alt-date": "AltDateWidget",
    "alt-datetime": "AltDateTimeWidget",
    color: "ColorWidget",
    file: "FileWidget",
  },
  number: {
    text: "TextWidget",
    select: "SelectWidget",
    updown: "UpDownWidget",
    range: "RangeWidget",
    radio: "RadioWidget",
    hidden: "HiddenWidget",
  },
  integer: {
    text: "TextWidget",
    select: "SelectWidget",
    updown: "UpDownWidget",
    range: "RangeWidget",
    radio: "RadioWidget",
    hidden: "HiddenWidget",
  },
  array: {
    select: "SelectWidget",
    checkboxes: "CheckboxesWidget",
    files: "FileWidget",
    hidden: "HiddenWidget",
  },
};

export function canExpand(schema, uiSchema, formData) {
  if (!schema.additionalProperties) {
    return false;
  }
  const { expandable } = getUiOptions(uiSchema);
  if (expandable === false) {
    return expandable;
  }
  // if ui:options.expandable was not explicitly set to false, we can add
  // another property if we have not exceeded maxProperties yet
  if (schema.maxProperties !== undefined) {
    return Object.keys(formData).length < schema.maxProperties;
  }
  return true;
}

export function getDefaultRegistry() {
  return {
    fields,
    widgets,
    definitions: {},
    rootSchema: {},
    formContext: {},
  };
}

/* Gets the type of a given schema. */
export function getSchemaType(schema) {
  let { type } = schema;

  if (!type && schema.const) {
    return guessType(schema.const);
  }

  if (!type && schema.enum) {
    return "string";
  }

  if (!type && (schema.properties || schema.additionalProperties)) {
    return "object";
  }

  if (type instanceof Array && type.length === 2 && type.includes("null")) {
    return type.find(type => type !== "null");
  }

  return type;
}

export function getWidget(schema, widget, registeredWidgets = {}) {
  const type = getSchemaType(schema);

  function mergeOptions(Widget) {
    // cache return value as property of widget for proper react reconciliation
    if (!Widget.MergedWidget) {
      const defaultOptions =
        (Widget.defaultProps && Widget.defaultProps.options) || {};
      Widget.MergedWidget = ({ options = {}, ...props }) => (
        <Widget options={{ ...defaultOptions, ...options }} {...props} />
      );
    }
    return Widget.MergedWidget;
  }

  if (
    typeof widget === "function" ||
    ReactIs.isForwardRef(React.createElement(widget)) ||
    ReactIs.isMemo(widget)
  ) {
    return mergeOptions(widget);
  }

  if (typeof widget !== "string") {
    throw new Error(`Unsupported widget definition: ${typeof widget}`);
  }

  if (registeredWidgets.hasOwnProperty(widget)) {
    const registeredWidget = registeredWidgets[widget];
    return getWidget(schema, registeredWidget, registeredWidgets);
  }

  if (!widgetMap.hasOwnProperty(type)) {
    throw new Error(`No widget for type "${type}"`);
  }

  if (widgetMap[type].hasOwnProperty(widget)) {
    const registeredWidget = registeredWidgets[widgetMap[type][widget]];
    return getWidget(schema, registeredWidget, registeredWidgets);
  }

  throw new Error(`No widget "${widget}" for type "${type}"`);
}

export function hasWidget(schema, widget, registeredWidgets = {}) {
  try {
    getWidget(schema, widget, registeredWidgets);
    return true;
  } catch (e) {
    if (
      e.message &&
      (e.message.startsWith("No widget") ||
        e.message.startsWith("Unsupported widget"))
    ) {
      return false;
    }
    throw e;
  }
}

function computeDefaults(
  _schema,
  parentDefaults,
  rootSchema,
  rawFormData = {},
  includeUndefinedValues = false
) {
  let schema = isObject(_schema) ? _schema : {};
  const formData = isObject(rawFormData) ? rawFormData : {};
  // Compute the defaults recursively: give highest priority to deepest nodes.
  let defaults = parentDefaults;
  if (isObject(defaults) && isObject(schema.default)) {
    // For object defaults, only override parent defaults that are defined in
    // schema.default.
    defaults = mergeObjects(defaults, schema.default);
  } else if ("default" in schema) {
    // Use schema defaults for this node.
    defaults = schema.default;
  } else if ("$ref" in schema) {
    // Use referenced schema defaults for this node.
    const refSchema = findSchemaDefinition(schema.$ref, rootSchema);
    return computeDefaults(
      refSchema,
      defaults,
      rootSchema,
      formData,
      includeUndefinedValues
    );
  } else if ("dependencies" in schema) {
    const resolvedSchema = resolveDependencies(schema, rootSchema, formData);
    return computeDefaults(
      resolvedSchema,
      defaults,
      rootSchema,
      formData,
      includeUndefinedValues
    );
  } else if (isFixedItems(schema)) {
    defaults = schema.items.map((itemSchema, idx) =>
      computeDefaults(
        itemSchema,
        Array.isArray(parentDefaults) ? parentDefaults[idx] : undefined,
        rootSchema,
        formData,
        includeUndefinedValues
      )
    );
  } else if ("oneOf" in schema) {
    schema =
      schema.oneOf[getMatchingOption(undefined, schema.oneOf, rootSchema)];
  } else if ("anyOf" in schema) {
    schema =
      schema.anyOf[getMatchingOption(undefined, schema.anyOf, rootSchema)];
  }

  // Not defaults defined for this node, fallback to generic typed ones.
  if (typeof defaults === "undefined") {
    defaults = schema.default;
  }

  switch (getSchemaType(schema)) {
    // We need to recur for object schema inner default values.
    case "object":
      return Object.keys(schema.properties || {}).reduce((acc, key) => {
        // Compute the defaults for this node, with the parent defaults we might
        // have from a previous run: defaults[key].
        let computedDefault = computeDefaults(
          schema.properties[key],
          (defaults || {})[key],
          rootSchema,
          (formData || {})[key],
          includeUndefinedValues
        );
        if (includeUndefinedValues || computedDefault !== undefined) {
          acc[key] = computedDefault;
        }
        return acc;
      }, {});

    case "array":
      // Inject defaults into existing array defaults
      if (Array.isArray(defaults)) {
        defaults = defaults.map((item, idx) => {
          return computeDefaults(
            schema.items[idx] || schema.additionalItems || {},
            item,
            rootSchema
          );
        });
      }

      // Deeply inject defaults into already existing form data
      if (Array.isArray(rawFormData)) {
        defaults = rawFormData.map((item, idx) => {
          return computeDefaults(
            schema.items,
            (defaults || {})[idx],
            rootSchema,
            item
          );
        });
      }
      if (schema.minItems) {
        if (!isMultiSelect(schema, rootSchema)) {
          const defaultsLength = defaults ? defaults.length : 0;
          if (schema.minItems > defaultsLength) {
            const defaultEntries = defaults || [];
            // populate the array with the defaults
            const fillerSchema = Array.isArray(schema.items)
              ? schema.additionalItems
              : schema.items;
            const fillerEntries = fill(
              new Array(schema.minItems - defaultsLength),
              computeDefaults(fillerSchema, fillerSchema.defaults, rootSchema)
            );
            // then fill up the rest with either the item default or empty, up to minItems

            return defaultEntries.concat(fillerEntries);
          }
        } else {
          return defaults ? defaults : [];
        }
      }
  }
  return defaults;
}

export function getDefaultFormState(
  _schema,
  formData,
  rootSchema = {},
  includeUndefinedValues = false
) {
  if (!isObject(_schema)) {
    throw new Error("Invalid schema: " + _schema);
  }
  const schema = retrieveSchema(_schema, rootSchema, formData);
  const defaults = computeDefaults(
    schema,
    _schema.default,
    rootSchema,
    formData,
    includeUndefinedValues
  );
  if (typeof formData === "undefined") {
    // No form data? Use schema defaults.
    return defaults;
  }
  if (isObject(formData) || Array.isArray(formData)) {
    return mergeDefaultsWithFormData(defaults, formData);
  }
  if (formData === 0 || formData === false || formData === "") {
    return formData;
  }
  return formData || defaults;
}

/**
 * When merging defaults and form data, we want to merge in this specific way:
 * - objects are deeply merged
 * - arrays are merged in such a way that:
 *   - when the array is set in form data, only array entries set in form data
 *     are deeply merged; additional entries from the defaults are ignored
 *   - when the array is not set in form data, the default is copied over
 * - scalars are overwritten/set by form data
 */
export function mergeDefaultsWithFormData(defaults, formData) {
  if (Array.isArray(formData)) {
    if (!Array.isArray(defaults)) {
      defaults = [];
    }
    return formData.map((value, idx) => {
      if (defaults[idx]) {
        return mergeDefaultsWithFormData(defaults[idx], value);
      }
      return value;
    });
  } else if (isObject(formData)) {
    const acc = Object.assign({}, defaults); // Prevent mutation of source object.
    return Object.keys(formData).reduce((acc, key) => {
      acc[key] = mergeDefaultsWithFormData(
        defaults ? defaults[key] : {},
        formData[key]
      );
      return acc;
    }, acc);
  } else {
    return formData;
  }
}

export function getUiOptions(uiSchema) {
  // get all passed options from ui:widget, ui:options, and ui:<optionName>
  return Object.keys(uiSchema)
    .filter(key => key.indexOf("ui:") === 0)
    .reduce((options, key) => {
      const value = uiSchema[key];
      if (key === "ui:widget" && isObject(value)) {
        console.warn(
          "Setting options via ui:widget object is deprecated, use ui:options instead"
        );
        return {
          ...options,
          ...(value.options || {}),
          widget: value.component,
        };
      }
      if (key === "ui:options" && isObject(value)) {
        return { ...options, ...value };
      }
      return { ...options, [key.substring(3)]: value };
    }, {});
}

export function getDisplayLabel(schema, uiSchema, rootSchema) {
  const uiOptions = getUiOptions(uiSchema);
  let { label: displayLabel = true } = uiOptions;
  const schemaType = getSchemaType(schema);

  if (schemaType === "array") {
    displayLabel =
      isMultiSelect(schema, rootSchema) ||
      isFilesArray(schema, uiSchema, rootSchema);
  }

  if (schemaType === "object") {
    displayLabel = false;
  }
  if (schemaType === "boolean" && !uiSchema["ui:widget"]) {
    displayLabel = false;
  }
  if (uiSchema["ui:field"]) {
    displayLabel = false;
  }
  return displayLabel;
}

export function isObject(thing) {
  if (typeof File !== "undefined" && thing instanceof File) {
    return false;
  }
  return typeof thing === "object" && thing !== null && !Array.isArray(thing);
}

export function mergeObjects(obj1, obj2, concatArrays = false) {
  // Recursively merge deeply nested objects.
  var acc = Object.assign({}, obj1); // Prevent mutation of source object.
  return Object.keys(obj2).reduce((acc, key) => {
    const left = obj1 ? obj1[key] : {},
      right = obj2[key];
    if (obj1 && obj1.hasOwnProperty(key) && isObject(right)) {
      acc[key] = mergeObjects(left, right, concatArrays);
    } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
      acc[key] = left.concat(right);
    } else {
      acc[key] = right;
    }
    return acc;
  }, acc);
}

export function asNumber(value) {
  if (value === "") {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (/\.$/.test(value)) {
    // "3." can't really be considered a number even if it parses in js. The
    // user is most likely entering a float.
    return value;
  }
  if (/\.0$/.test(value)) {
    // we need to return this as a string here, to allow for input like 3.07
    return value;
  }
  const n = Number(value);
  const valid = typeof n === "number" && !Number.isNaN(n);

  if (/\.\d*0$/.test(value)) {
    // It's a number, that's cool - but we need it as a string so it doesn't screw
    // with the user when entering dollar amounts or other values (such as those with
    // specific precision or number of significant digits)
    return value;
  }

  return valid ? n : value;
}

export function orderProperties(properties, order) {
  if (!Array.isArray(order)) {
    return properties;
  }

  const arrayToHash = arr =>
    arr.reduce((prev, curr) => {
      prev[curr] = true;
      return prev;
    }, {});
  const errorPropList = arr =>
    arr.length > 1
      ? `properties '${arr.join("', '")}'`
      : `property '${arr[0]}'`;
  const propertyHash = arrayToHash(properties);
  const orderFiltered = order.filter(
    prop => prop === "*" || propertyHash[prop]
  );
  const orderHash = arrayToHash(orderFiltered);

  const rest = properties.filter(prop => !orderHash[prop]);
  const restIndex = orderFiltered.indexOf("*");
  if (restIndex === -1) {
    if (rest.length) {
      throw new Error(
        `uiSchema order list does not contain ${errorPropList(rest)}`
      );
    }
    return orderFiltered;
  }
  if (restIndex !== orderFiltered.lastIndexOf("*")) {
    throw new Error("uiSchema order list contains more than one wildcard item");
  }

  const complete = [...orderFiltered];
  complete.splice(restIndex, 1, ...rest);
  return complete;
}

/**
 * This function checks if the given schema matches a single
 * constant value.
 */
export function isConstant(schema) {
  return (
    (Array.isArray(schema.enum) && schema.enum.length === 1) ||
    schema.hasOwnProperty("const")
  );
}

export function toConstant(schema) {
  if (Array.isArray(schema.enum) && schema.enum.length === 1) {
    return schema.enum[0];
  } else if (schema.hasOwnProperty("const")) {
    return schema.const;
  } else {
    throw new Error("schema cannot be inferred as a constant");
  }
}

export function isSelect(_schema, rootSchema = {}) {
  const schema = retrieveSchema(_schema, rootSchema);
  const altSchemas = schema.oneOf || schema.anyOf;
  if (Array.isArray(schema.enum)) {
    return true;
  } else if (Array.isArray(altSchemas)) {
    return altSchemas.every(altSchemas => isConstant(altSchemas));
  }
  return false;
}

export function isMultiSelect(schema, rootSchema = {}) {
  if (!schema.uniqueItems || !schema.items) {
    return false;
  }
  return isSelect(schema.items, rootSchema);
}

export function isFilesArray(schema, uiSchema, rootSchema = {}) {
  if (uiSchema["ui:widget"] === "files") {
    return true;
  } else if (schema.items) {
    const itemsSchema = retrieveSchema(schema.items, rootSchema);
    return itemsSchema.type === "string" && itemsSchema.format === "data-url";
  }
  return false;
}

export function isFixedItems(schema) {
  return (
    Array.isArray(schema.items) &&
    schema.items.length > 0 &&
    schema.items.every(item => isObject(item))
  );
}

export function allowAdditionalItems(schema) {
  if (schema.additionalItems === true) {
    console.warn("additionalItems=true is currently not supported");
  }
  return isObject(schema.additionalItems);
}

export function optionsList(schema) {
  if (schema.enum) {
    return schema.enum.map((value, i) => {
      const label = (schema.enumNames && schema.enumNames[i]) || String(value);
      return { label, value };
    });
  } else {
    const altSchemas = schema.oneOf || schema.anyOf;
    return altSchemas.map((schema, i) => {
      const value = toConstant(schema);
      const label = schema.title || String(value);
      return {
        schema,
        label,
        value,
      };
    });
  }
}

export function findSchemaDefinition($ref, rootSchema = {}) {
  const origRef = $ref;
  if ($ref.startsWith("#")) {
    // Decode URI fragment representation.
    $ref = decodeURIComponent($ref.substring(1));
  } else {
    throw new Error(`Could not find a definition for ${origRef}.`);
  }
  const current = jsonpointer.get(rootSchema, $ref);
  if (current === undefined) {
    throw new Error(`Could not find a definition for ${origRef}.`);
  }
  if (current.hasOwnProperty("$ref")) {
    return findSchemaDefinition(current.$ref, rootSchema);
  }
  return current;
}

// In the case where we have to implicitly create a schema, it is useful to know what type to use
//  based on the data we are defining
export const guessType = function guessType(value) {
  if (Array.isArray(value)) {
    return "array";
  } else if (typeof value === "string") {
    return "string";
  } else if (value == null) {
    return "null";
  } else if (typeof value === "boolean") {
    return "boolean";
  } else if (!isNaN(value)) {
    return "number";
  } else if (typeof value === "object") {
    return "object";
  }
  // Default to string if we can't figure it out
  return "string";
};

// This function will create new "properties" items for each key in our formData
export function stubExistingAdditionalProperties(
  schema,
  rootSchema = {},
  formData = {}
) {
  // Clone the schema so we don't ruin the consumer's original
  schema = {
    ...schema,
    properties: { ...schema.properties },
  };

  Object.keys(formData).forEach(key => {
    if (schema.properties.hasOwnProperty(key)) {
      // No need to stub, our schema already has the property
      return;
    }

    let additionalProperties;
    if (schema.additionalProperties.hasOwnProperty("$ref")) {
      additionalProperties = retrieveSchema(
        { $ref: schema.additionalProperties["$ref"] },
        rootSchema,
        formData
      );
    } else if (schema.additionalProperties.hasOwnProperty("type")) {
      additionalProperties = { ...schema.additionalProperties };
    } else {
      additionalProperties = { type: guessType(formData[key]) };
    }

    // The type of our new key should match the additionalProperties value;
    schema.properties[key] = additionalProperties;
    // Set our additional property flag so we know it was dynamically added
    schema.properties[key][ADDITIONAL_PROPERTY_FLAG] = true;
  });

  return schema;
}

export function resolveSchema(schema, rootSchema = {}, formData = {}) {
  if (schema.hasOwnProperty("$ref")) {
    return resolveReference(schema, rootSchema, formData);
  } else if (schema.hasOwnProperty("dependencies")) {
    const resolvedSchema = resolveDependencies(schema, rootSchema, formData);
    return retrieveSchema(resolvedSchema, rootSchema, formData);
  } else if (schema.hasOwnProperty("allOf")) {
    return {
      ...schema,
      allOf: schema.allOf.map(allOfSubschema =>
        retrieveSchema(allOfSubschema, rootSchema, formData)
      ),
    };
  } else {
    // No $ref or dependencies attribute found, returning the original schema.
    return schema;
  }
}

function resolveReference(schema, rootSchema, formData) {
  // Retrieve the referenced schema definition.
  const $refSchema = findSchemaDefinition(schema.$ref, rootSchema);
  // Drop the $ref property of the source schema.
  const { $ref, ...localSchema } = schema;
  // Update referenced schema definition with local schema properties.
  return retrieveSchema(
    { ...$refSchema, ...localSchema },
    rootSchema,
    formData
  );
}

export function retrieveSchema(schema, rootSchema = {}, formData = {}) {
  if (!isObject(schema)) {
    return {};
  }
  let resolvedSchema = resolveSchema(schema, rootSchema, formData);
  if ("allOf" in schema) {
    try {
      resolvedSchema = mergeAllOf({
        ...resolvedSchema,
        allOf: resolvedSchema.allOf,
      });
    } catch (e) {
      console.warn("could not merge subschemas in allOf:\n" + e);
      const { allOf, ...resolvedSchemaWithoutAllOf } = resolvedSchema;
      return resolvedSchemaWithoutAllOf;
    }
  }
  const hasAdditionalProperties =
    resolvedSchema.hasOwnProperty("additionalProperties") &&
    resolvedSchema.additionalProperties !== false;
  if (hasAdditionalProperties) {
    return stubExistingAdditionalProperties(
      resolvedSchema,
      rootSchema,
      formData
    );
  }
  return resolvedSchema;
}

function resolveDependencies(schema, rootSchema, formData) {
  // Drop the dependencies from the source schema.
  let { dependencies = {}, ...resolvedSchema } = schema;
  if ("oneOf" in resolvedSchema) {
    resolvedSchema =
      resolvedSchema.oneOf[
        getMatchingOption(formData, resolvedSchema.oneOf, rootSchema)
      ];
  } else if ("anyOf" in resolvedSchema) {
    resolvedSchema =
      resolvedSchema.anyOf[
        getMatchingOption(formData, resolvedSchema.anyOf, rootSchema)
      ];
  }
  return processDependencies(
    dependencies,
    resolvedSchema,
    rootSchema,
    formData
  );
}
function processDependencies(
  dependencies,
  resolvedSchema,
  rootSchema,
  formData
) {
  // Process dependencies updating the local schema properties as appropriate.
  for (const dependencyKey in dependencies) {
    // Skip this dependency if its trigger property is not present.
    if (formData[dependencyKey] === undefined) {
      continue;
    }
    // Skip this dependency if it is not included in the schema (such as when dependencyKey is itself a hidden dependency.)
    if (
      resolvedSchema.properties &&
      !(dependencyKey in resolvedSchema.properties)
    ) {
      continue;
    }
    const {
      [dependencyKey]: dependencyValue,
      ...remainingDependencies
    } = dependencies;
    if (Array.isArray(dependencyValue)) {
      resolvedSchema = withDependentProperties(resolvedSchema, dependencyValue);
    } else if (isObject(dependencyValue)) {
      resolvedSchema = withDependentSchema(
        resolvedSchema,
        rootSchema,
        formData,
        dependencyKey,
        dependencyValue
      );
    }
    return processDependencies(
      remainingDependencies,
      resolvedSchema,
      rootSchema,
      formData
    );
  }
  return resolvedSchema;
}

function withDependentProperties(schema, additionallyRequired) {
  if (!additionallyRequired) {
    return schema;
  }
  const required = Array.isArray(schema.required)
    ? Array.from(new Set([...schema.required, ...additionallyRequired]))
    : additionallyRequired;
  return { ...schema, required: required };
}

function withDependentSchema(
  schema,
  rootSchema,
  formData,
  dependencyKey,
  dependencyValue
) {
  let { oneOf, ...dependentSchema } = retrieveSchema(
    dependencyValue,
    rootSchema,
    formData
  );
  schema = mergeSchemas(schema, dependentSchema);
  // Since it does not contain oneOf, we return the original schema.
  if (oneOf === undefined) {
    return schema;
  } else if (!Array.isArray(oneOf)) {
    throw new Error(`invalid: it is some ${typeof oneOf} instead of an array`);
  }
  // Resolve $refs inside oneOf.
  const resolvedOneOf = oneOf.map(subschema =>
    subschema.hasOwnProperty("$ref")
      ? resolveReference(subschema, rootSchema, formData)
      : subschema
  );
  return withExactlyOneSubschema(
    schema,
    rootSchema,
    formData,
    dependencyKey,
    resolvedOneOf
  );
}

function withExactlyOneSubschema(
  schema,
  rootSchema,
  formData,
  dependencyKey,
  oneOf
) {
  const validSubschemas = oneOf.filter(subschema => {
    if (!subschema.properties) {
      return false;
    }
    const { [dependencyKey]: conditionPropertySchema } = subschema.properties;
    if (conditionPropertySchema) {
      const conditionSchema = {
        type: "object",
        properties: {
          [dependencyKey]: conditionPropertySchema,
        },
      };
      const { errors } = validateFormData(formData, conditionSchema);
      return errors.length === 0;
    }
  });
  if (validSubschemas.length !== 1) {
    console.warn(
      "ignoring oneOf in dependencies because there isn't exactly one subschema that is valid"
    );
    return schema;
  }
  const subschema = validSubschemas[0];
  const {
    [dependencyKey]: conditionPropertySchema,
    ...dependentSubschema
  } = subschema.properties;
  const dependentSchema = { ...subschema, properties: dependentSubschema };
  return mergeSchemas(
    schema,
    retrieveSchema(dependentSchema, rootSchema, formData)
  );
}

// Recursively merge deeply nested schemas.
// The difference between mergeSchemas and mergeObjects
// is that mergeSchemas only concats arrays for
// values under the "required" keyword, and when it does,
// it doesn't include duplicate values.
export function mergeSchemas(obj1, obj2) {
  var acc = Object.assign({}, obj1); // Prevent mutation of source object.
  return Object.keys(obj2).reduce((acc, key) => {
    const left = obj1 ? obj1[key] : {},
      right = obj2[key];
    if (obj1 && obj1.hasOwnProperty(key) && isObject(right)) {
      acc[key] = mergeSchemas(left, right);
    } else if (
      obj1 &&
      obj2 &&
      (getSchemaType(obj1) === "object" || getSchemaType(obj2) === "object") &&
      key === "required" &&
      Array.isArray(left) &&
      Array.isArray(right)
    ) {
      // Don't include duplicate values when merging
      // "required" fields.
      acc[key] = union(left, right);
    } else {
      acc[key] = right;
    }
    return acc;
  }, acc);
}

function isArguments(object) {
  return Object.prototype.toString.call(object) === "[object Arguments]";
}

export function deepEquals(a, b, ca = [], cb = []) {
  // Partially extracted from node-deeper and adapted to exclude comparison
  // checks for functions.
  // https://github.com/othiym23/node-deeper
  if (a === b) {
    return true;
  } else if (typeof a === "function" || typeof b === "function") {
    // Assume all functions are equivalent
    // see https://github.com/rjsf-team/react-jsonschema-form/issues/255
    return true;
  } else if (typeof a !== "object" || typeof b !== "object") {
    return false;
  } else if (a === null || b === null) {
    return false;
  } else if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  } else if (a instanceof RegExp && b instanceof RegExp) {
    return (
      a.source === b.source &&
      a.global === b.global &&
      a.multiline === b.multiline &&
      a.lastIndex === b.lastIndex &&
      a.ignoreCase === b.ignoreCase
    );
  } else if (isArguments(a) || isArguments(b)) {
    if (!(isArguments(a) && isArguments(b))) {
      return false;
    }
    let slice = Array.prototype.slice;
    return deepEquals(slice.call(a), slice.call(b), ca, cb);
  } else {
    if (a.constructor !== b.constructor) {
      return false;
    }

    let ka = Object.keys(a);
    let kb = Object.keys(b);
    // don't bother with stack acrobatics if there's nothing there
    if (ka.length === 0 && kb.length === 0) {
      return true;
    }
    if (ka.length !== kb.length) {
      return false;
    }

    let cal = ca.length;
    while (cal--) {
      if (ca[cal] === a) {
        return cb[cal] === b;
      }
    }
    ca.push(a);
    cb.push(b);

    ka.sort();
    kb.sort();
    for (var j = ka.length - 1; j >= 0; j--) {
      if (ka[j] !== kb[j]) {
        return false;
      }
    }

    let key;
    for (let k = ka.length - 1; k >= 0; k--) {
      key = ka[k];
      if (!deepEquals(a[key], b[key], ca, cb)) {
        return false;
      }
    }

    ca.pop();
    cb.pop();

    return true;
  }
}

export function shouldRender(comp, nextProps, nextState) {
  const { props, state } = comp;
  return !deepEquals(props, nextProps) || !deepEquals(state, nextState);
}

export function toIdSchema(
  schema,
  id,
  rootSchema,
  formData = {},
  idPrefix = "root"
) {
  const idSchema = {
    $id: id || idPrefix,
  };
  if ("$ref" in schema || "dependencies" in schema || "allOf" in schema) {
    const _schema = retrieveSchema(schema, rootSchema, formData);
    return toIdSchema(_schema, id, rootSchema, formData, idPrefix);
  }
  if ("items" in schema && !schema.items.$ref) {
    return toIdSchema(schema.items, id, rootSchema, formData, idPrefix);
  }
  if (schema.type !== "object") {
    return idSchema;
  }
  for (const name in schema.properties || {}) {
    const field = schema.properties[name];
    const fieldId = idSchema.$id + "_" + name;
    idSchema[name] = toIdSchema(
      isObject(field) ? field : {},
      fieldId,
      rootSchema,
      // It's possible that formData is not an object -- this can happen if an
      // array item has just been added, but not populated with data yet
      (formData || {})[name],
      idPrefix
    );
  }
  return idSchema;
}

export function toPathSchema(schema, name = "", rootSchema, formData = {}) {
  const pathSchema = {
    $name: name.replace(/^\./, ""),
  };
  if ("$ref" in schema || "dependencies" in schema || "allOf" in schema) {
    const _schema = retrieveSchema(schema, rootSchema, formData);
    return toPathSchema(_schema, name, rootSchema, formData);
  }

  if (schema.hasOwnProperty("additionalProperties")) {
    pathSchema.__rjsf_additionalProperties = true;
  }

  if (schema.hasOwnProperty("items") && Array.isArray(formData)) {
    formData.forEach((element, i) => {
      pathSchema[i] = toPathSchema(
        schema.items,
        `${name}.${i}`,
        rootSchema,
        element
      );
    });
  } else if (schema.hasOwnProperty("properties")) {
    for (const property in schema.properties) {
      pathSchema[property] = toPathSchema(
        schema.properties[property],
        `${name}.${property}`,
        rootSchema,
        // It's possible that formData is not an object -- this can happen if an
        // array item has just been added, but not populated with data yet
        (formData || {})[property]
      );
    }
  }
  return pathSchema;
}

export function parseDateString(dateString, includeTime = true) {
  if (!dateString) {
    return {
      year: -1,
      month: -1,
      day: -1,
      hour: includeTime ? -1 : 0,
      minute: includeTime ? -1 : 0,
      second: includeTime ? -1 : 0,
    };
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Unable to parse date " + dateString);
  }
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1, // oh you, javascript.
    day: date.getUTCDate(),
    hour: includeTime ? date.getUTCHours() : 0,
    minute: includeTime ? date.getUTCMinutes() : 0,
    second: includeTime ? date.getUTCSeconds() : 0,
  };
}

export function toDateString(
  { year, month, day, hour = 0, minute = 0, second = 0 },
  time = true
) {
  const utcTime = Date.UTC(year, month - 1, day, hour, minute, second);
  const datetime = new Date(utcTime).toJSON();
  return time ? datetime : datetime.slice(0, 10);
}

export function utcToLocal(jsonDate) {
  if (!jsonDate) {
    return "";
  }

  // required format of `"yyyy-MM-ddThh:mm" followed by optional ":ss" or ":ss.SSS"
  // https://html.spec.whatwg.org/multipage/input.html#local-date-and-time-state-(type%3Ddatetime-local)
  // > should be a _valid local date and time string_ (not GMT)

  // Note - date constructor passed local ISO-8601 does not correctly
  // change time to UTC in node pre-8
  const date = new Date(jsonDate);

  const yyyy = pad(date.getFullYear(), 4);
  const MM = pad(date.getMonth() + 1, 2);
  const dd = pad(date.getDate(), 2);
  const hh = pad(date.getHours(), 2);
  const mm = pad(date.getMinutes(), 2);
  const ss = pad(date.getSeconds(), 2);
  const SSS = pad(date.getMilliseconds(), 3);

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${SSS}`;
}

export function localToUTC(dateString) {
  if (dateString) {
    return new Date(dateString).toJSON();
  }
}

export function pad(num, size) {
  let s = String(num);
  while (s.length < size) {
    s = "0" + s;
  }
  return s;
}

export function dataURItoBlob(dataURI) {
  // Split metadata from data
  const splitted = dataURI.split(",");
  // Split params
  const params = splitted[0].split(";");
  // Get mime-type from params
  const type = params[0].replace("data:", "");
  // Filter the name property from params
  const properties = params.filter(param => {
    return param.split("=")[0] === "name";
  });
  // Look for the name and use unknown if no name property.
  let name;
  if (properties.length !== 1) {
    name = "unknown";
  } else {
    // Because we filtered out the other property,
    // we only have the name case here.
    name = properties[0].split("=")[1];
  }

  // Built the Uint8Array Blob parameter from the base64 string.
  const binary = atob(splitted[1]);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  // Create the blob object
  const blob = new window.Blob([new Uint8Array(array)], { type });

  return { blob, name };
}

export function rangeSpec(schema) {
  const spec = {};
  if (schema.multipleOf) {
    spec.step = schema.multipleOf;
  }
  if (schema.minimum || schema.minimum === 0) {
    spec.min = schema.minimum;
  }
  if (schema.maximum || schema.maximum === 0) {
    spec.max = schema.maximum;
  }
  return spec;
}

export function getMatchingOption(formData, options, rootSchema) {
  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    // If the schema describes an object then we need to add slightly more
    // strict matching to the schema, because unless the schema uses the
    // "requires" keyword, an object will match the schema as long as it
    // doesn't have matching keys with a conflicting type. To do this we use an
    // "anyOf" with an array of requires. This augmentation expresses that the
    // schema should match if any of the keys in the schema are present on the
    // object and pass validation.
    if (option.properties) {
      // Create an "anyOf" schema that requires at least one of the keys in the
      // "properties" object
      const requiresAnyOf = {
        anyOf: Object.keys(option.properties).map(key => ({
          required: [key],
        })),
      };

      let augmentedSchema;

      // If the "anyOf" keyword already exists, wrap the augmentation in an "allOf"
      if (option.anyOf) {
        // Create a shallow clone of the option
        const { ...shallowClone } = option;

        if (!shallowClone.allOf) {
          shallowClone.allOf = [];
        } else {
          // If "allOf" already exists, shallow clone the array
          shallowClone.allOf = shallowClone.allOf.slice();
        }

        shallowClone.allOf.push(requiresAnyOf);

        augmentedSchema = shallowClone;
      } else {
        augmentedSchema = Object.assign({}, option, requiresAnyOf);
      }

      // Remove the "required" field as it's likely that not all fields have
      // been filled in yet, which will mean that the schema is not valid
      delete augmentedSchema.required;

      if (isValid(augmentedSchema, formData, rootSchema)) {
        return i;
      }
    } else if (isValid(option, formData, rootSchema)) {
      return i;
    }
  }
  return 0;
}

// Check to see if a schema specifies that a value must be true
export function schemaRequiresTrueValue(schema) {
  // Check if const is a truthy value
  if (schema.const) {
    return true;
  }

  // Check if an enum has a single value of true
  if (schema.enum && schema.enum.length === 1 && schema.enum[0] === true) {
    return true;
  }

  // If anyOf has a single value, evaluate the subschema
  if (schema.anyOf && schema.anyOf.length === 1) {
    return schemaRequiresTrueValue(schema.anyOf[0]);
  }

  // If oneOf has a single value, evaluate the subschema
  if (schema.oneOf && schema.oneOf.length === 1) {
    return schemaRequiresTrueValue(schema.oneOf[0]);
  }

  // Evaluate each subschema in allOf, to see if one of them requires a true
  // value
  if (schema.allOf) {
    return schema.allOf.some(schemaRequiresTrueValue);
  }

  return false;
}
