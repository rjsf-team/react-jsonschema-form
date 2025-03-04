import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import { CONST_KEY, DEFAULT_KEY, PROPERTIES_KEY } from '../constants';
import { Experimental_CustomMergeAllOf, FormContextType, RJSFSchema, StrictRJSFSchema, ValidatorType } from '../types';
import retrieveSchema from './retrieveSchema';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema';

/** Finds the option inside the `schema['any/oneOf']` list which has the `properties[selectorField].default` or
 * `properties[selectorField].const` that matches the `formData[selectorField]` value. For the purposes of this
 * function, `selectorField` is either `schema.discriminator.propertyName` or `fallbackField`. The `LayoutGridField`
 * works directly with schemas in a recursive manner, making this faster than `getFirstMatchingOption()`.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param schema - The schema element in which to search for the selected anyOf/oneOf option
 * @param fallbackField - The field to use as a backup selector field if the schema does not have a required field
 * @param xxx - Either `anyOf` or `oneOf`, defines which value is being sought
 * @param [formData={}] - The form data that is used to determine which anyOf/oneOf option to descend
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @returns - The anyOf/oneOf option that matches the selector field in the schema or undefined if nothing is selected
 */
export default function findSelectedOptionInXxxOf<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  validator: ValidatorType<T, S, F>,
  rootSchema: S,
  schema: S,
  fallbackField: string,
  xxx: 'anyOf' | 'oneOf',
  formData: T = {} as T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>
): S | undefined {
  if (Array.isArray(schema[xxx])) {
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    const selectorField = discriminator || fallbackField;
    const xxxOfs = schema[xxx]!.map((xxxOf) =>
      retrieveSchema<T, S, F>(validator, xxxOf as S, rootSchema, formData, experimental_customMergeAllOf)
    );
    const data = get(formData, selectorField);
    if (data !== undefined) {
      return xxxOfs.find((xxx) => {
        return isEqual(
          get(xxx, [PROPERTIES_KEY, selectorField, DEFAULT_KEY], get(xxx, [PROPERTIES_KEY, selectorField, CONST_KEY])),
          data
        );
      });
    }
  }
  return undefined;
}
