import { CONST_KEY, DEFAULT_KEY } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getOptionSelectorSchema from '../getOptionSelectorSchema.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import getClosestMatchingOption from './getClosestMatchingOption.ts';
import retrieveSchema from './retrieveSchema.ts';

/** Finds the option of `schema['any/oneOf']` a field renders for `formData`. With a discriminator, it is the option whose
 * `properties[discriminator].default` or `.const` matches the `formData[discriminator]` value, making this faster than
 * `getFirstMatchingOption()` for the `LayoutGridField`, which works directly with schemas in a recursive manner, and no
 * matching value has nothing selected. With none, it is the option `getClosestMatchingOption()` picks for the data, as
 * `MultiSchemaField` picks it, since no one property's value can tell the options apart.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param schema - The schema element in which to search for the selected anyOf/oneOf option
 * @param _fallbackField - Not read, since options with no discriminator aren't told apart by any one property
 * @param xxx - Either `anyOf` or `oneOf`, defines which value is being sought
 * @param [formData] - The form data that is used to determine which anyOf/oneOf option to descend
 * @returns - The anyOf/oneOf option that matches the discriminator, or the closest to the data for options with no
 *        discriminator, or undefined if a discriminated list selects nothing
 */
export default function findSelectedOptionInXxxOf<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  schema: S,
  _fallbackField: string,
  xxx: 'anyOf' | 'oneOf',
  formData?: T,
): S | undefined {
  if (Array.isArray(schema[xxx])) {
    const xxxOfs = schema[xxx].map((xxxOf) => retrieveSchema<T, S, F>(context, xxxOf as S, rootSchema, formData));
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    if (!discriminator) {
      // shortcut: a tie goes to the first option, and each read picks afresh, where `MultiSchemaField` keeps the option a
      // user picked in its own state, which schemas alone can't see; pass the form's selection in once a caller has it
      return xxxOfs[getClosestMatchingOption<T, S, F>(context, rootSchema, formData, xxxOfs)];
    }
    const data = getByPath(formData, discriminator);
    if (data !== undefined) {
      return xxxOfs.find((option) => {
        // An option without a selector has no value to match
        const selector = getOptionSelectorSchema<S>(option, discriminator, (written) =>
          retrieveSchema<unknown, S, F>(context, written, rootSchema, data),
        );
        if (selector === undefined) {
          return false;
        }
        const constValue = getByPath(selector, CONST_KEY);
        return deepEquals(getByPath(selector, DEFAULT_KEY, constValue), data);
      });
    }
  }
  return undefined;
}
