import type { ErrorObject } from 'ajv';

import type { Localizer } from './types.ts';

/** Runs the `localizer` over the `errors`, with the property names in their params quoted while it runs so that
 * `processRawValidationErrors()` can find them in the localized messages and replace them with `title` or `ui:title`.
 * See #4348, #4349, #4387, and #4402.
 *
 * @param localizer - The localizer to run
 * @param [errors] - The errors to localize in place
 */
export default function localizeErrors(localizer: Localizer, errors?: null | ErrorObject[]) {
  (errors ?? []).forEach((error) => {
    ['missingProperty', 'property'].forEach((key) => {
      if (error.params?.[key]) {
        // oxlint-disable-next-line no-param-reassign
        error.params[key] = `'${error.params[key]}'`;
      }
    });
    if (typeof error.params?.deps === 'string') {
      // As `error.params.deps` is the comma+space separated list of missing dependencies, enclose each dependency separately.
      // For example, `A, B` is converted into `'A', 'B'`.
      // oxlint-disable-next-line no-param-reassign
      error.params.deps = error.params.deps
        .split(', ')
        .map((v) => `'${v}'`)
        .join(', ');
    }
  });
  localizer(errors);
  // Revert to originals
  (errors ?? []).forEach((error) => {
    ['missingProperty', 'property'].forEach((key) => {
      const quoted: unknown = error.params?.[key];
      if (typeof quoted === 'string') {
        // oxlint-disable-next-line no-param-reassign
        error.params[key] = quoted.slice(1, -1);
      }
    });
    if (typeof error.params?.deps === 'string') {
      // Remove surrounding quotes from each missing dependency. For example, `'A', 'B'` is reverted to `A, B`.
      // oxlint-disable-next-line no-param-reassign
      error.params.deps = error.params.deps
        .split(', ')
        .map((v) => v.slice(1, -1))
        .join(', ');
    }
  });
}
