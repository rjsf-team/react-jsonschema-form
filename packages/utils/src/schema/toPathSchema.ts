import { JSONSchema7 } from 'json-schema';
import get from 'lodash/get';
import set from 'lodash/set';

import {
  ALL_OF_NAME,
  ADDITIONAL_PROPERTIES_NAME,
  DEPENDENCIES_NAME,
  ITEMS_NAME,
  PROPERTIES_NAME,
  REF_NAME,
} from '../constants';
import { PathSchema } from '../types';

export default function toPathSchema<T = any>(
  schema: JSONSchema7,
  name: string,
  rootSchema: JSONSchema7,
  formData: T
): PathSchema | PathSchema[] {
  const pathSchema: PathSchema = {
    $name: name.replace(/^\./, ''),
  };
  if (REF_NAME in schema || DEPENDENCIES_NAME in schema || ALL_OF_NAME in schema) {
    const _schema = retrieveSchema(schema, rootSchema, formData);
    return toPathSchema(_schema, name, rootSchema, formData);
  }

  if (schema.hasOwnProperty(ADDITIONAL_PROPERTIES_NAME)) {
    set(pathSchema, '__rjsf_additionalProperties', true);
  }

  if (schema.hasOwnProperty(ITEMS_NAME) && Array.isArray(formData)) {
    formData.forEach((element, i) => {
      pathSchema[i] = toPathSchema(
        schema.items,
        `${name}.${i}`,
        rootSchema,
        element
      );
    });
  } else if (schema.hasOwnProperty(PROPERTIES_NAME)) {
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
