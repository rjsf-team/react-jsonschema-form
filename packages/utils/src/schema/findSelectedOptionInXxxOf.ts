import { CONST_KEY, DEFAULT_KEY } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getOptionSelectorSchema from '../getOptionSelectorSchema.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import getClosestMatchingOption from './getClosestMatchingOption.ts';
import retrieveSchema from './retrieveSchema.ts';

/** Finds the option inside the `schema['any/oneOf']` list which has the `properties[selectorField].default` or
 * `properties[selectorField].const` that matches the `formData[selectorField]` value. For the purposes of this
 * function, `selectorField` is either `schema.discriminator.propertyName` or `fallbackField`. The `LayoutGridField`
 * works directly with schemas in a recursive manner, so a selector saves it `getFirstMatchingOption()`'s validation.
 *
 * Options with no discriminator have a selector to match only where every one of them holds a `default` or `const` in
 * `fallbackField`, since a value only some hold can't tell them apart. Otherwise the option is the one
 * `getClosestMatchingOption()` picks for the data, as `MultiSchemaField` picks it.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param schema - The schema element in which to search for the selected anyOf/oneOf option
 * @param fallbackField - The field to use as a backup selector field if the schema does not have a required field
 * @param xxx - Either `anyOf` or `oneOf`, defines which value is being sought
 * @param [formData={}] - The form data that is used to determine which anyOf/oneOf option to descend
 * @returns - The anyOf/oneOf option that matches the selector field in the schema, or the closest to the data for options
 *        with no selector, or undefined if nothing is selected
 */
export default function findSelectedOptionInXxxOf<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  schema: S,
  fallbackField: string,
  xxx: 'anyOf' | 'oneOf',
  formData: T = {} as T,
): S | undefined {
  if (Array.isArray(schema[xxx])) {
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    const selectorField = discriminator || fallbackField;
    const xxxOfs = schema[xxx].map((xxxOf) => retrieveSchema<T, S, F>(context, xxxOf as S, rootSchema, formData));
    const data = getByPath(formData, selectorField);
    const selectorValues = xxxOfs.map((option) => {
      const selector = getOptionSelectorSchema<S>(option, selectorField, (written) =>
        retrieveSchema<unknown, S, F>(context, written, rootSchema, data),
      );
      const constValue = getByPath(selector, CONST_KEY);
      return getByPath(selector, DEFAULT_KEY, constValue);
    });
    if (!discriminator && selectorValues.includes(undefined)) {
      // shortcut: a tie goes to the first option, where `MultiSchemaField` keeps the one a user picked in its own state,
      // which schemas alone can't see; pass the form's selection in if a caller needs the picked option
      return xxxOfs[getClosestMatchingOption<T, S, F>(context, rootSchema, formData, xxxOfs)];
    }
    if (data !== undefined) {
      return xxxOfs.find((_, index) => deepEquals(selectorValues[index], data));
    }
  }
  return undefined;
}
