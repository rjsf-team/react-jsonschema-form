import get from 'lodash/get';

import {
  ALL_OF_NAME,
  DEPENDENCIES_NAME,
  ITEMS_NAME,
  PROPERTIES_NAME,
  REF_NAME,
} from '../constants';
import isObject from '../isObject';
import { IdSchema, RJSFSchema, ValidatorType } from '../types';
import retrieveSchema from './retrieveSchema';

export default function toIdSchema<T>(
  validator: ValidatorType,
  schema: RJSFSchema,
  id?: string | null,
  rootSchema?: RJSFSchema,
  formData?: T,
  idPrefix = 'root',
  idSeparator = '_'
): IdSchema {
  if (REF_NAME in schema || DEPENDENCIES_NAME in schema || ALL_OF_NAME in schema) {
    const _schema = retrieveSchema<T>(validator, schema, rootSchema, formData);
    return toIdSchema<T>(validator, _schema, id, rootSchema, formData, idPrefix, idSeparator);
  }
  if (ITEMS_NAME in schema && !get(schema, [ITEMS_NAME, REF_NAME])) {
    return toIdSchema<T>(
      validator,
      get(schema, ITEMS_NAME) as RJSFSchema,
      id,
      rootSchema,
      formData,
      idPrefix,
      idSeparator
    );
  }
  const $id = id || idPrefix;
  const idSchema: IdSchema = { $id } as IdSchema;
  if (schema.type === 'object' && PROPERTIES_NAME in schema) {
    for (const name in schema.properties || {}) {
      const field = get(schema, [PROPERTIES_NAME, name]);
      const fieldId = idSchema.$id + idSeparator + name;
      idSchema[name] = toIdSchema<T>(
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
  return idSchema;
}
