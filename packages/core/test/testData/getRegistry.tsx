import { createSchemaUtils, englishStringTranslator, Registry } from '@rjsf/utils';
import getDefaultRegistry from '../../src/getDefaultRegistry';
import validator from '@rjsf/validator-ajv8';

export default function getRegistry(
  rootSchema: Registry['rootSchema'],
  fields: Registry['fields'] = {},
  templates: Partial<Registry['templates']> = {},
  widgets: Registry['widgets'] = {},
  formContext: Registry['formContext'] = {}
): Registry {
  const defaults = getDefaultRegistry();
  const schemaUtils = createSchemaUtils(validator, rootSchema);
  return {
    fields: { ...defaults.fields, ...fields },
    templates: { ...defaults.templates, ...templates },
    widgets: { ...defaults.widgets, ...widgets },
    formContext,
    rootSchema,
    schemaUtils,
    translateString: englishStringTranslator,
  };
}
