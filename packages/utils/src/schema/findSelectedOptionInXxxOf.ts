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
 * Options with no discriminator aren't told apart by that value alone, since a user can clear or edit a property that is
 * only given a `default`, so where none holds the value the option is the one `getClosestMatchingOption()` picks for the
 * data, as `MultiSchemaField` picks it. A discriminated list with no matching value has nothing selected.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param schema - The schema element in which to search for the selected anyOf/oneOf option
 * @param fallbackField - The field to use as a backup selector field if the schema does not have a required field
 * @param xxx - Either `anyOf` or `oneOf`, defines which value is being sought
 * @param [formData={}] - The form data that is used to determine which anyOf/oneOf option to descend
 * @returns - The anyOf/oneOf option that matches the selector field in the schema, else the closest to the data for options
 *        with no discriminator, or undefined if a discriminated list selects nothing
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
    const selected =
      data === undefined
        ? undefined
        : xxxOfs.find((option) => {
            // An option without a selector has no value to match
            const selector = getOptionSelectorSchema<S>(option, selectorField, (written) =>
              retrieveSchema<unknown, S, F>(context, written, rootSchema, data),
            );
            if (selector === undefined) {
              return false;
            }
            const constValue = getByPath(selector, CONST_KEY);
            return deepEquals(getByPath(selector, DEFAULT_KEY, constValue), data);
          });
    if (selected || discriminator) {
      return selected;
    }
    // shortcut: a tie goes to the first option, where `MultiSchemaField` keeps the one a user picked in its own state,
    // which schemas alone can't see; pass the form's selection in if a caller needs the picked option
    return xxxOfs[getClosestMatchingOption<T, S, F>(context, rootSchema, formData, xxxOfs)];
  }
  return undefined;
}
