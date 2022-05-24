import get from 'lodash/get';
import set from 'lodash/set';

import { REF_NAME, ADDITIONAL_PROPERTY_FLAG } from '../constants';
import guessType from '../guessType';
import isObject from '../isObject';
import { GenericObjectType, RJSFSchema, ValidatorType } from '../types';
import { retrieveSchema } from './retrieveSchema';

// This function will create new 'properties' items for each key in our formData
export default function stubExistingAdditionalProperties<T = any>(
  validator: ValidatorType,
  aSchema: RJSFSchema,
  rootSchema: RJSFSchema = {},
  aFormData: T
) {
  // Clone the schema so we don't ruin the consumer's original
  const schema = {
    ...aSchema,
    properties: { ...aSchema.properties },
  };

  // make sure formData is an object
  const formData: GenericObjectType = isObject(aFormData) ? aFormData : {};

  Object.keys(formData).forEach(key => {
    if (schema.properties.hasOwnProperty(key)) {
      // No need to stub, our schema already has the property
      return;
    }

    let additionalProperties;
    if (schema.additionalProperties && typeof schema.additionalProperties !== 'boolean') {
      if (schema.additionalProperties.hasOwnProperty(REF_NAME)) {
        additionalProperties = retrieveSchema(
          validator,
          { $ref: get(schema.additionalProperties, [REF_NAME]) },
          rootSchema,
          formData
        );
      } else if (schema.additionalProperties.hasOwnProperty('type')) {
        additionalProperties = { ...schema.additionalProperties };
      } else {
        additionalProperties = { type: guessType(get(formData, [key])) };
      }
    }

    // The type of our new key should match the additionalProperties value;
    schema.properties[key] = additionalProperties;
    // Set our additional property flag so we know it was dynamically added
    set(schema.properties, [key, ADDITIONAL_PROPERTY_FLAG], true);
  });

  return schema;
}
