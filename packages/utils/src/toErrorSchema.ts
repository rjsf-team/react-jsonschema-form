import ErrorSchemaBuilder from './ErrorSchemaBuilder.ts';
import { toPath } from './pathUtils.ts';
import type { ErrorSchema, RJSFValidationError } from './types.ts';

/** Transforms a rjsf validation errors list:
 * [
 *   {property: '.level1.level2[2].level3', message: 'err a'},
 *   {property: '.level1.level2[2].level3', message: 'err b'},
 *   {property: '.level1.level2[4].level3', message: 'err b'},
 * ]
 * Into an error tree:
 * {
 *   level1: {
 *     level2: {
 *       2: {level3: {errors: ['err a', 'err b']}},
 *       4: {level3: {errors: ['err b']}},
 *     }
 *   }
 * };
 *
 * @param errors - The list of RJSFValidationError objects
 * @returns - The `ErrorSchema` built from the list of `RJSFValidationErrors`
 */
export default function toErrorSchema<T = any>(errors: RJSFValidationError[]): ErrorSchema<T> {
  const builder = new ErrorSchemaBuilder<T>();
  if (errors.length) {
    errors.forEach((error) => {
      const { property, message } = error;
      // When the property is missing or the root element ('.'), toPath produces an empty path
      const path = property ? toPath(property) : [];
      if (message) {
        builder.addErrors(message, path);
      }
    });
  }
  return builder.ErrorSchema;
}
