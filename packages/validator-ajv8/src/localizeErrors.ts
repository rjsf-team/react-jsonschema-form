import type { ErrorObject } from 'ajv';

import type { Localizer } from './types.ts';

/** Returns a copy of the `params` with the property names they hold quoted, as Ajv quotes them in its own messages
 *
 * @param params - The params of an error
 * @returns - The copy of the `params` with `missingProperty`, `property` and each of the `deps` quoted
 */
function quoteProperties(params: ErrorObject['params']): ErrorObject['params'] {
  const quoted = { ...params };
  for (const key of ['missingProperty', 'property']) {
    const value: unknown = params[key];
    if (typeof value === 'string') {
      quoted[key] = `'${value}'`;
    }
  }
  const deps: unknown = params.deps;
  if (typeof deps === 'string') {
    // `deps` is the comma+space separated list of missing dependencies, so each is quoted: `A, B` becomes `'A', 'B'`
    quoted.deps = deps
      .split(', ')
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
    copy: { ...error, params: quoteProperties(error.params) },
  }));
  localizer(errors && localized.map(({ copy }) => copy));
  for (const { error, copy } of localized) {
    error.message = copy.message;
  }
}
