import { JSONSchema7 } from 'json-schema';
import get from 'lodash/get';

import {
  ALL_OF_NAME,
  DEPENDENCIES_NAME,
  ITEMS_NAME,
  PROPERTIES_NAME,
  REF_NAME,
} from '../constants';
import isObject from '../isObject';
import { IdSchema } from '../types';

export default function toIdSchema<T>(
  schema: JSONSchema7,
  id: string,
  rootSchema: JSONSchema7,
  formData: T,
  idPrefix = 'root',
  idSeparator = '_'
): IdSchema | IdSchema[] {
  const idSchema: IdSchema = {
    $id: id || idPrefix,
  };
  if (REF_NAME in schema || DEPENDENCIES_NAME in schema || ALL_OF_NAME in schema) {
    const _schema = retrieveSchema(schema, rootSchema, formData);
    return toIdSchema(_schema, id, rootSchema, formData, idPrefix, idSeparator);
  }
  if (ITEMS_NAME in schema && !get(schema, [ITEMS_NAME, REF_NAME])) {
    return toIdSchema(
      get(schema, ITEMS_NAME) as JSONSchema7,
      id,
      rootSchema,
      formData,
      idPrefix,
      idSeparator
    );
  }
  if (schema.type !== 'object' || !(PROPERTIES_NAME in schema)) {
    return idSchema;
  }
  for (const name in schema.properties || {}) {
    const field = get(schema, [PROPERTIES_NAME, name]);
    const fieldId = idSchema.$id + idSeparator + name;
    idSchema[name] = toIdSchema(
      isObject(field) ? field : {},
      fieldId,
      rootSchema,
      // It's possible that formData is not an object -- this can happen if an
      // array item has just been added, but not populated with data yet
      (formData || {})[name],
      idPrefix,
      idSeparator
    );
  }
  return idSchema;
}
