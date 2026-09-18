import type { Registry } from '@rjsf/utils';
import { DEFAULT_ID_PREFIX, DEFAULT_ID_SEPARATOR, createSchemaUtils } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import { buildRegistry } from './Theme.ts';

/** Use for react testing library tests where we directly test the component rather than testing inside a Form
 */
export function getTestRegistry(
  rootSchema: Registry['rootSchema'] = {},
  fields: Registry['fields'] = {},
  templates: Partial<Registry['templates']> = {},
  widgets: Registry['widgets'] = {},
  formContext: Registry['formContext'] = {},
  globalFormOptions: Registry['globalFormOptions'] = {
    idPrefix: DEFAULT_ID_PREFIX,
    idSeparator: DEFAULT_ID_SEPARATOR,
    useFallbackUiForUnsupportedType: false,
  },
): Registry {
  const schemaUtils = createSchemaUtils(validator, rootSchema);
  const registry: Registry = {
    ...buildRegistry(
      { schema: rootSchema, validator, fields, templates, widgets, formContext },
      rootSchema,
      schemaUtils,
    ),
    globalFormOptions,
  };
  // Freeze shallowly so a test that mutates the registry or swaps an entry in a component map fails loudly. A deep
  // freeze would reach caller-owned objects like `formContext`, `rootSchema` and the validator's internal caches.
  Object.freeze(registry.fields);
  Object.freeze(registry.templates);
  Object.freeze(registry.widgets);
  return Object.freeze(registry);
}
