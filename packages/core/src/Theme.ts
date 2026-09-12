import type {
  FormContextType,
  GlobalFormOptions,
  Registry,
  RJSFSchema,
  SchemaUtilsType,
  StrictRJSFSchema,
} from '@rjsf/utils';
import {
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  englishStringTranslator,
  UI_DEFINITIONS_KEY,
  UI_GLOBAL_OPTIONS_KEY,
} from '@rjsf/utils';

import { generateFields } from './components/fields/index.ts';
import type { FormProps } from './components/Form.tsx';
import { generateTemplates } from './components/templates/index.ts';
import { generateWidgets } from './components/widgets/index.ts';

/** The core theme: every field, widget and template `@rjsf/core` implements */
export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): Pick<Registry<T, S, F>, 'fields' | 'widgets' | 'templates'> {
  return {
    fields: generateFields<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
    templates: generateTemplates<T, S, F>(),
  };
}

/** Extracts the `GlobalFormOptions` from the given Form `props`
 *
 * @param props - The form props to extract the global form options from
 * @returns - The `GlobalFormOptions` from the props
 */
function getGlobalFormOptions<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FormProps<T, S, F>,
): GlobalFormOptions {
  const {
    experimental_componentUpdateStrategy,
    idSeparator = DEFAULT_ID_SEPARATOR,
    idPrefix = DEFAULT_ID_PREFIX,
    nameGenerator,
    useFallbackUiForUnsupportedType = false,
  } = props;
  // Omit any options that are undefined or null
  return {
    idPrefix,
    idSeparator,
    useFallbackUiForUnsupportedType,
    ...(experimental_componentUpdateStrategy !== undefined && { experimental_componentUpdateStrategy }),
    ...(nameGenerator !== undefined && { nameGenerator }),
  };
}

/** Builds the `Registry` for a form from the given `props`, `schema` and `schemaUtils`
 *
 * @param props - The form props to build the registry from
 * @param schema - The root schema for the form
 * @param schemaUtils - The `SchemaUtilsType` implementation to put on the registry
 * @returns - The `Registry` described by the inputs
 */
export function buildRegistry<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FormProps<T, S, F>,
  schema: S,
  schemaUtils: SchemaUtilsType<T, S, F>,
): Registry<T, S, F> {
  const { translateString = englishStringTranslator, uiSchema = {} } = props;
  const { fields, templates, widgets } = generateTheme<T, S, F>();
  return {
    fields: { ...fields, ...props.fields },
    templates: {
      ...templates,
      ...props.templates,
      ButtonTemplates: {
        ...templates.ButtonTemplates,
        ...props.templates?.ButtonTemplates,
      },
    },
    widgets: { ...widgets, ...props.widgets },
    rootSchema: schema,
    // `F` may be narrower than `{}`, but an omitted formContext is an empty object
    formContext: props.formContext ?? ({} as F),
    schemaUtils,
    translateString,
    globalUiOptions: uiSchema[UI_GLOBAL_OPTIONS_KEY],
    globalFormOptions: getGlobalFormOptions(props),
    uiSchemaDefinitions: uiSchema[UI_DEFINITIONS_KEY] ?? {},
  };
}
