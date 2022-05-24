import { RJSFSchema, ValidatorType } from '../types';

export default function getMatchingOption<T = any>(
  validator: ValidatorType, formData: T | undefined, options: RJSFSchema[], rootSchema: RJSFSchema
) {
  // For performance, skip validating subschemas if formData is undefined. We just
  // want to get the first option in that case.
  if (formData === undefined) {
    return 0;
  }
  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    // If the schema describes an object then we need to add slightly more
    // strict matching to the schema, because unless the schema uses the
    // "requires" keyword, an object will match the schema as long as it
    // doesn't have matching keys with a conflicting type. To do this we use an
    // "anyOf" with an array of requires. This augmentation expresses that the
    // schema should match if any of the keys in the schema are present on the
    // object and pass validation.
    if (option.properties) {
      // Create an "anyOf" schema that requires at least one of the keys in the
      // "properties" object
      const requiresAnyOf = {
        anyOf: Object.keys(option.properties).map(key => ({
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

      if (validator.isValid(augmentedSchema, formData, rootSchema)) {
        return i;
      }
    } else if (validator.isValid(option, formData, rootSchema)) {
      return i;
    }
  }
  return 0;
}
