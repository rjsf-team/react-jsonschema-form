import isObject from './isObject';
import { RJSFSchema } from './types';

export default function allowAdditionalItems(schema: RJSFSchema) {
  if (schema.additionalItems === true) {
    console.warn('additionalItems=true is currently not supported');
  }
  return isObject(schema.additionalItems);
}
