import type { ErrorObject } from 'ajv';

import { dependencyNames } from './processRawValidationErrors.ts';
import type { Localizer } from './types.ts';

/** Returns a copy of the error's `params` with the property names they hold quoted, as Ajv quotes them in its own
 * messages
 *
 * @param error - The error whose params to quote
 * @returns - The copy of the `params` with `missingProperty`, `property` and each of the `deps` quoted
 */
function quoteProperties(error: ErrorObject): ErrorObject['params'] {
  const { params } = error;
  const quoted = { ...params };
  for (const key of ['missingProperty', 'property']) {
    const value: unknown = params[key];
    if (typeof value === 'string') {
      quoted[key] = `'${value}'`;
    }
  }
  if (typeof params.deps === 'string') {
    // Each dependency is quoted: `A, B` becomes `'A', 'B'`
    quoted.deps = dependencyNames(error)
      .map((v) => `'${v}'`)
      .join(', ');
  }
  return quoted;
}

/** Runs the `localizer` over copies of the `errors` whose property names are quoted, so that the localized messages
 * name them the way `processRawValidationErrors()` looks for when it replaces them with `title` or `ui:title`, then
 * gives each error the message its copy was localized to. The `errors` keep their params, and keep their messages when
 * the localizer throws. See #4348, #4349, #4387, and #4402.
 *
 * @param localizer - The localizer to run
 * @param [errors] - The errors to localize the messages of
 */
export default function localizeErrors(localizer: Localizer, errors?: null | ErrorObject[]) {
  const localized = (errors ?? []).map((error) => ({
    error,
    copy: { ...error, params: quoteProperties(error) },
  }));
  localizer(errors && localized.map(({ copy }) => copy));
  for (const { error, copy } of localized) {
    error.message = copy.message;
  }
}
