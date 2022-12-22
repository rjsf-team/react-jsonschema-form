import get from "lodash/get";
import set from "lodash/set";

import {
  ALL_OF_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  DEPENDENCIES_KEY,
  ITEMS_KEY,
  NAME_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  RJSF_ADDITONAL_PROPERTIES_FLAG,
} from "../constants";
import {
  PathSchema,
  RJSFSchema,
  StrictRJSFSchema,
  ValidatorType,
} from "../types";
import retrieveSchema from "./retrieveSchema";

/** Generates an `PathSchema` object for the `schema`, recursively
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which the `PathSchema` is desired
 * @param [name=''] - The base name for the schema
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @returns - The `PathSchema` object for the `schema`
 */
export default function toPathSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema
>(
  validator: ValidatorType<T, S>,
  schema: S,
  name = "",
  rootSchema?: S,
  formData?: T
): PathSchema<T> {
  if (REF_KEY in schema || DEPENDENCIES_KEY in schema || ALL_OF_KEY in schema) {
    const _schema = retrieveSchema<T, S>(
      validator,
      schema,
      rootSchema,
      formData
    );
    return toPathSchema<T, S>(validator, _schema, name, rootSchema, formData);
  }

  const pathSchema: PathSchema = {
    [NAME_KEY]: name.replace(/^\./, ""),
  } as PathSchema;

  if (
    ADDITIONAL_PROPERTIES_KEY in schema &&
    schema[ADDITIONAL_PROPERTIES_KEY] !== false
  ) {
    set(pathSchema, RJSF_ADDITONAL_PROPERTIES_FLAG, true);
  }

  if (ITEMS_KEY in schema && Array.isArray(formData)) {
    formData.forEach((element, i: number) => {
      pathSchema[i] = toPathSchema<T>(
        validator,
        schema.items as RJSFSchema,
        `${name}.${i}`,
        rootSchema,
        element
      );
    });
  } else if (PROPERTIES_KEY in schema) {
    for (const property in schema.properties) {
      const field = get(schema, [PROPERTIES_KEY, property]);
      pathSchema[property] = toPathSchema<T, S>(
        validator,
        field,
        `${name}.${property}`,
        rootSchema,
        // It's possible that formData is not an object -- this can happen if an
        // array item has just been added, but not populated with data yet
        get(formData, [property])
      );
    }
  }
  return pathSchema as PathSchema<T>;
}
