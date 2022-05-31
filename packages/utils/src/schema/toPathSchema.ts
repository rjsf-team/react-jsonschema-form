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
import { PathSchema, RJSFSchema, ValidatorType } from '../types';
import retrieveSchema from './retrieveSchema';

export default function toPathSchema<T = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  name: string,
  rootSchema: RJSFSchema,
  formData?: T
): PathSchema {
  if (REF_NAME in schema || DEPENDENCIES_NAME in schema || ALL_OF_NAME in schema) {
    const _schema = retrieveSchema<T>(validator, schema, rootSchema, formData);
    return toPathSchema<T>(validator, _schema, name, rootSchema, formData);
  }

  const pathSchema: PathSchema = {
    $name: name.replace(/^\./, ''),
  } as PathSchema;

  if (schema.hasOwnProperty(ADDITIONAL_PROPERTIES_NAME)) {
    set(pathSchema, '__rjsf_additionalProperties', true);
  }

  if (schema.hasOwnProperty(ITEMS_NAME) && Array.isArray(formData)) {
    formData.forEach((element, i: number) => {
      const item = get(schema, [ITEMS_NAME, i], {});
      pathSchema[i] = toPathSchema<T>(
        validator,
        item as RJSFSchema,
        `${name}.${i}`,
        rootSchema,
        element
      );
    });
  } else if (schema.hasOwnProperty(PROPERTIES_NAME)) {
    for (const property in schema.properties) {
      const field = get(schema, [PROPERTIES_NAME, property]);
      pathSchema[property] = toPathSchema<T>(
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
  return pathSchema;
}
