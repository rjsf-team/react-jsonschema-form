import { JSONSchema7 } from 'json-schema';

import isObject from './isObject';

export default function allowAdditionalItems(schema: JSONSchema7) {
  if (schema.additionalItems === true) {
    console.warn('additionalItems=true is currently not supported');
  }
  return isObject(schema.additionalItems);
}
