import get from 'lodash/get';
import set from 'lodash/set';

import { REF_KEY, ADDITIONAL_PROPERTY_FLAG } from '../constants';
import guessType from '../guessType';
import isObject from '../isObject';
import { GenericObjectType, RJSFSchema, ValidatorType } from '../types';
import retrieveSchema from './retrieveSchema';

/** Creates new 'properties' items for each key in the `formData`
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param theSchema - The schema for which the existing additional properties is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s * @param validator
 * @param [aFormData] - The current formData, if any, to assist retrieving a schema
 * @returns - The updated schema with additional properties stubbed
 */
export default function stubExistingAdditionalProperties<T = any>(
  validator: ValidatorType,
  theSchema: RJSFSchema,
  rootSchema?: RJSFSchema,
  aFormData?: T
): RJSFSchema {
  // Clone the schema so we don't ruin the consumer's original
  const schema = {
    ...theSchema,
    properties: { ...theSchema.properties },
  };

  // make sure formData is an object
  const formData: GenericObjectType = aFormData && isObject(aFormData) ? aFormData : {};
  Object.keys(formData).forEach((key) => {
    if (key in schema.properties) {
      // No need to stub, our schema already has the property
      return;
    }

    let additionalProperties: RJSFSchema = {};
    if (typeof schema.additionalProperties !== 'boolean') {
      if (REF_KEY in schema.additionalProperties!) {
        additionalProperties = retrieveSchema<T>(
          validator,
          { $ref: get(schema.additionalProperties, [REF_KEY]) },
          rootSchema,
          formData as T
        );
      } else if ('type' in schema.additionalProperties!) {
        additionalProperties = { ...schema.additionalProperties };
      } else {
        additionalProperties = { type: guessType(get(formData, [key])) };
      }
    } else {
      additionalProperties = { type: guessType(get(formData, [key])) };
    }
    console.log({ key, additionalProperties })
    // The type of our new key should match the additionalProperties value;
    schema.properties[key] = additionalProperties;
    // Set our additional property flag so we know it was dynamically added
    set(schema.properties, [key, ADDITIONAL_PROPERTY_FLAG], true);
  });

  return schema;
}
