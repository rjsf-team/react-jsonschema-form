import get from "lodash/get";

import {
  ALL_OF_KEY,
  DEPENDENCIES_KEY,
  ID_KEY,
  ITEMS_KEY,
  PROPERTIES_KEY,
  REF_KEY,
} from "../constants";
import isObject from "../isObject";
import {
  IdSchema,
  RJSFSchema,
  StrictRJSFSchema,
  ValidatorType,
} from "../types";
import retrieveSchema from "./retrieveSchema";

/** Generates an `IdSchema` object for the `schema`, recursively
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which the `IdSchema` is desired
 * @param [id] - The base id for the schema
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [idPrefix='root'] - The prefix to use for the id
 * @param [idSeparator='_'] - The separator to use for the path segments in the id
 * @returns - The `IdSchema` object for the `schema`
 */
export default function toIdSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema
>(
  validator: ValidatorType<T, S>,
  schema: S,
  id?: string | null,
  rootSchema?: S,
  formData?: T,
  idPrefix = "root",
  idSeparator = "_"
): IdSchema<T> {
  if (REF_KEY in schema || DEPENDENCIES_KEY in schema || ALL_OF_KEY in schema) {
    const _schema = retrieveSchema<T, S>(
      validator,
      schema,
      rootSchema,
      formData
    );
    return toIdSchema<T>(
      validator,
      _schema,
      id,
      rootSchema,
      formData,
      idPrefix,
      idSeparator
    );
  }
  if (ITEMS_KEY in schema && !get(schema, [ITEMS_KEY, REF_KEY])) {
    return toIdSchema<T, S>(
      validator,
      get(schema, ITEMS_KEY) as S,
      id,
      rootSchema,
      formData,
      idPrefix,
      idSeparator
    );
  }
  const $id = id || idPrefix;
  const idSchema: IdSchema = { $id } as IdSchema<T>;
  if (schema.type === "object" && PROPERTIES_KEY in schema) {
    for (const name in schema.properties) {
      const field = get(schema, [PROPERTIES_KEY, name]);
      const fieldId = idSchema[ID_KEY] + idSeparator + name;
      idSchema[name] = toIdSchema<T, S>(
        validator,
        isObject(field) ? field : {},
        fieldId,
        rootSchema,
        // It's possible that formData is not an object -- this can happen if an
        // array item has just been added, but not populated with data yet
        get(formData, [name]),
        idPrefix,
        idSeparator
      );
    }
  }
  return idSchema as IdSchema<T>;
}
