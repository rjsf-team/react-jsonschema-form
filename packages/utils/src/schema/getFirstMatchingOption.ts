import get from 'lodash/get';
import has from 'lodash/has';
import isNumber from 'lodash/isNumber';
import isObject from 'lodash/isObject';

import { ANY_OF_KEY, ALL_OF_KEY, ONE_OF_KEY, PROPERTIES_KEY, REF_KEY } from '../constants';
import getOptionMatchingSimpleDiscriminator from '../getOptionMatchingSimpleDiscriminator';
import { FormContextType, RJSFSchema, StrictRJSFSchema, ValidatorType } from '../types';

/** Returns a copy of `schema` with properties that could cause deep recursive AJV
 * validation (oneOf, anyOf, allOf, $ref) replaced by `{}` (accept any value).
 * This prevents O(options^depth) validation work in schemas with cross-referencing definitions.
 */
function stripRecursiveProperties<S extends StrictRJSFSchema = RJSFSchema>(schema: S): S {
  const properties = schema[PROPERTIES_KEY];
  if (!isObject(properties)) {
    return schema;
  }
  const shallow: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries(properties)) {
    if (typeof prop !== 'object' || prop === null) {
      shallow[key] = prop;
    } else if (ONE_OF_KEY in prop || ANY_OF_KEY in prop || ALL_OF_KEY in prop || REF_KEY in prop) {
      shallow[key] = {};
    } else {
      shallow[key] = prop;
    }
  }
  return { ...schema, [PROPERTIES_KEY]: shallow };
}

/** Given the `formData` and list of `options`, attempts to find the index of the first option that matches the data.
 * Matching is shallow: properties containing `oneOf`, `anyOf`, `allOf`, or `$ref` are treated as unconstrained during
 * validation to avoid exponential AJV validation time with cross-referencing schemas.
 * Always returns the first option if there is nothing that matches.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param formData - The current formData, if any, used to figure out a match
 * @param options - The list of options to find a matching options from
 * @param rootSchema - The root schema, used to primarily to look up `$ref`s
 * @param [discriminatorField] - The optional name of the field within the options object whose value is used to
 *          determine which option is selected
 * @returns - The index of the first matched option or 0 if none is available
 */
export default function getFirstMatchingOption<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  formData: T | undefined,
  options: S[],
  rootSchema: S,
  discriminatorField?: string,
): number {
  // For performance, skip validating subschemas if formData is undefined. We just
  // want to get the first option in that case.
  if (formData === undefined) {
    return 0;
  }

  const simpleDiscriminatorMatch = getOptionMatchingSimpleDiscriminator(formData, options, discriminatorField);
  if (isNumber(simpleDiscriminatorMatch)) {
    return simpleDiscriminatorMatch;
  }

  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    // If we have a discriminator field, then we will use this to make the determination
    if (discriminatorField && has(option, [PROPERTIES_KEY, discriminatorField])) {
      const value = get(formData, discriminatorField);
      const discriminator: S = get(option, [PROPERTIES_KEY, discriminatorField], {}) as S;
      if (validator.isValid(discriminator, value, rootSchema)) {
        return i;
      }
    } else if (option[PROPERTIES_KEY]) {
      // If the schema describes an object then we need to add slightly more
      // strict matching to the schema, because unless the schema uses the
      // "requires" keyword, an object will match the schema as long as it
      // doesn't have matching keys with a conflicting type. To do this we use an
      // "anyOf" with an array of requires. This augmentation expresses that the
      // schema should match if any of the keys in the schema are present on the
      // object and pass validation.
      //
      // Create an "anyOf" schema that requires at least one of the keys in the
      // "properties" object
      const requiresAnyOf = {
        anyOf: Object.keys(option[PROPERTIES_KEY]).map((key) => ({
          required: [key],
        })),
      };

      let augmentedSchema;

      // If the "anyOf" keyword already exists, wrap the augmentation in an "allOf"
      if (option.anyOf) {
        // Create a shallow clone of the option
        const { ...shallowClone } = option;

        if (!shallowClone.allOf) {
          shallowClone.allOf = [];
        } else {
          // If "allOf" already exists, shallow clone the array
          shallowClone.allOf = shallowClone.allOf.slice();
        }

        shallowClone.allOf.push(requiresAnyOf);

        augmentedSchema = shallowClone;
      } else {
        augmentedSchema = Object.assign({}, option, requiresAnyOf);
      }

      // Remove the "required" field as it's likely that not all fields have
      // been filled in yet, which will mean that the schema is not valid
      delete augmentedSchema.required;

      if (validator.isValid(stripRecursiveProperties(augmentedSchema as S), formData, rootSchema)) {
        return i;
      }
    } else if (validator.isValid(stripRecursiveProperties(option), formData, rootSchema)) {
      return i;
    }
  }
  return 0;
}
