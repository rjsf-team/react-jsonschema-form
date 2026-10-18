import { isStubbedProperty } from './additionalPropertiesUtils.ts';
import getPropertySchema from './getPropertySchema.ts';
import { getByPath } from './pathUtils.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Compares the value of `discriminatorField` within `formData` against the value of `discriminatorField` within schema for each `option`.
 * Returns index of first `option` whose discriminator matches formData. Returns `undefined` if there is no match.
 * This function does not work with discriminators of `"type": "object"` and `"type": "array"`. A discriminator the
 * option doesn't declare, but that `retrieveSchema()` stubbed into its `properties` for the key of the data, is skipped:
 * a stub keeps the `const` or `enum` of the keyword that takes the key but drops its `not`, so it says nothing about
 * whether the option fits
 *
 * @param formData - The current formData, if any, used to figure out a match
 * @param options - The list of options to find a matching options from
 * @param [discriminatorField] - The optional name of the field within the options object whose value is used to
 *          determine which option is selected
 * @returns - The index of the matched option or undefined if there is no match
 */
export default function getOptionMatchingSimpleDiscriminator<T = unknown, S extends StrictRJSFSchema = RJSFSchema>(
  formData: T | undefined,
  options: S[],
  discriminatorField?: string,
): number | undefined {
  if (formData && discriminatorField) {
    const value = getByPath(formData, discriminatorField);

    if (value === undefined) {
      return undefined;
    }

    for (let i = 0; i < options.length; i += 1) {
      const option = options[i];
      const discriminator = getPropertySchema<S>(option, discriminatorField);

      if (!isStubbedProperty(discriminator) && discriminator.type !== 'object' && discriminator.type !== 'array') {
        if (discriminator.const === value) {
          return i;
        }
        const enumValues: readonly unknown[] | undefined = discriminator.enum;
        if (enumValues?.includes(value)) {
          return i;
        }
      }
    }
  }
  return undefined;
}
