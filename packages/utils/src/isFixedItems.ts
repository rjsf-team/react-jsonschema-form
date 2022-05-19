import { JSONSchema7 } from 'json-schema';

import isObject from './isObject';

export default function isFixedItems(schema: JSONSchema7) {
  return (
    Array.isArray(schema.items) &&
    schema.items.length > 0 &&
    schema.items.every(item => isObject(item))
  );
}
