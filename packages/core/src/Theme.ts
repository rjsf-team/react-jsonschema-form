import type {
  ClassMap,
  FormClassMap,
  FormContextType,
  GlobalFormOptions,
  MergedClassMap,
  Registry,
  RJSFSchema,
  SchemaUtilsType,
  StrictRJSFSchema,
  ThemePresentation,
} from '@rjsf/utils';
import {
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  englishStringTranslator,
  mergeClassMaps,
  mergeThemePresentation,
  pickGlobalUiOptions,
  UI_DEFINITIONS_KEY,
  UI_GLOBAL_OPTIONS_KEY,
  WIDGET_FIELD_PRESENTATION,
} from '@rjsf/utils';

import { generateFields } from './components/fields/index.ts';
import type { FormProps } from './components/Form.tsx';
import { generateTemplates } from './components/templates/index.ts';
import { generateWidgets } from './components/widgets/index.ts';

/** Which parts of a field `@rjsf/core`'s fields and widgets draw themselves. The fields that render one widget, the
 * discriminator selector of a layout grid's `LayoutMultiSchemaField` among them, leave every part to it, and a widget
 * draws only what its entry says, so the `FieldTemplate` draws the rest. The template labels a field whose value a
 * field below renders under the same id, the selected option or the fallback UI's value, so that field's control is
 * named once (#5358). `NullField`, which has no control for a label to name, draws its own title and description, as an
 * object does through the field default. A field rendered through the unsupported-field template draws its own as well,
 * whatever its field declares, which `SchemaField` decides as it plans it. Built fresh on every call, as the rest of the
 * theme is, since a caller may mutate it
 */
function generatePresentation(): ThemePresentation {
  return {
    widgets: {
      CheckboxWidget: { label: 'self', description: 'self', uncheckedIsFalse: true },
      CheckboxesWidget: { labelledBy: 'aria-labelledby' },
      RadioWidget: { labelledBy: 'aria-labelledby' },
      RatingWidget: { labelledBy: 'aria-labelledby' },
      AltDateWidget: { labelledBy: 'aria-labelledby' },
      AltDateTimeWidget: { labelledBy: 'aria-labelledby' },
    },
    fields: {
      AnyOfField: { label: 'template', description: 'template' },
      ArrayField: { ...WIDGET_FIELD_PRESENTATION },
      BooleanField: { ...WIDGET_FIELD_PRESENTATION },
      FallbackField: { label: 'template', description: 'template' },
      LayoutMultiSchemaField: { ...WIDGET_FIELD_PRESENTATION },
      NullField: { label: 'self', description: 'self' },
      NumberField: { ...WIDGET_FIELD_PRESENTATION },
      OneOfField: { label: 'template', description: 'template' },
      StringField: { ...WIDGET_FIELD_PRESENTATION },
    },
  };
}

/** The class names `@rjsf/core`'s components render by default: none, since core's markup is toolkit-independent and
 * carries only its `rjsf-` markers. A theme's `classMap` adds its framework's classes beside them
 */
const CLASS_MAP: MergedClassMap = {
  input: undefined,
  select: undefined,
  textarea: undefined,
  fileInput: undefined,
  rangeInput: undefined,
  rangeWrapper: undefined,
  checkboxWrapper: undefined,
  checkboxLabel: undefined,
  checkboxInput: undefined,
  checkboxInlineLabel: undefined,
  radioWrapper: undefined,
  radioLabel: undefined,
  radioInput: undefined,
  radioInlineLabel: undefined,
  disabled: undefined,
  altDateList: undefined,
  altDateListItem: undefined,
  altDateNowButton: undefined,
  altDateClearButton: undefined,
  fieldLabel: undefined,
  fieldErrors: undefined,
  fieldError: undefined,
  fieldHelp: undefined,
  fieldDescription: undefined,
  errorList: undefined,
  errorListHeading: undefined,
  errorListTitle: undefined,
  errorListItems: undefined,
  errorListItem: undefined,
  arrayFieldset: undefined,
  arrayItemList: undefined,
  arrayItem: undefined,
  arrayItemToolbox: undefined,
  objectFieldset: undefined,
  multiSchema: undefined,
  multiSchemaSelector: undefined,
  cyclicSchemaMessage: undefined,
  cyclicSchemaExpandButton: undefined,
  optionalDataAddButton: undefined,
  optionalDataRemoveButton: undefined,
  submitButton: undefined,
  iconButton: undefined,
  buttonIcon: undefined,
};

/** The core theme: every field, widget and template `@rjsf/core` implements, which parts of a field they draw, and the
 * class names they render, which are none
 */
export function generateTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): Pick<Registry<T, S, F>, 'fields' | 'widgets' | 'templates' | 'classMap'> & { presentation: ThemePresentation } {
  return {
    fields: generateFields<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
    templates: generateTemplates<T, S, F>(),
    presentation: generatePresentation(),
    classMap: { ...CLASS_MAP },
  };
}

function isClassMapKey(key: string): key is keyof ClassMap {
  return Object.hasOwn(CLASS_MAP, key);
}

/** Keeps the merged map's `ClassMap` keys. A Form `''` entry survives `mergeClassMaps()` so that it drops the theme's
 * class beneath it; it becomes `undefined` here, so an element reading it bare renders no `class` attribute. A function
 * entry no layer gives a class beneath is called with `''`, since core's own map leaves every key `undefined`
 *
 * @param map - The theme's class map with the Form's layered on top
 * @returns - Each `ClassMap` key's class, or `undefined` for none
 */
function resolveClassMap(map: FormClassMap): MergedClassMap {
  const resolved: Record<keyof ClassMap, string | undefined> = { ...CLASS_MAP };
  for (const [key, value] of Object.entries(map)) {
    if (isClassMapKey(key)) {
      const className = typeof value === 'function' ? value('') : value;
      resolved[key] = typeof className === 'string' && className ? className : undefined;
    }
  }
  return resolved;
}

/** Extracts the `GlobalFormOptions` from the given Form `props`
 *
 * @param props - The form props to extract the global form options from
 * @returns - The `GlobalFormOptions` from the props
 */
function getGlobalFormOptions<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FormProps<T, S, F>): GlobalFormOptions {
  const {
    idSeparator = DEFAULT_ID_SEPARATOR,
    idPrefix = DEFAULT_ID_PREFIX,
    nameGenerator,
    useFallbackUiForUnsupportedType = false,
  } = props;
  return {
    idPrefix,
    idSeparator,
    useFallbackUiForUnsupportedType,
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
export function buildRegistry<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FormProps<T, S, F>, schema: S, schemaUtils: SchemaUtilsType<T, S, F>): Registry<T, S, F> {
  const { translateString = englishStringTranslator, uiSchema } = props;
  const { fields, templates, widgets, presentation, classMap } = generateTheme<T, S, F>();
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
    presentation: mergeThemePresentation(presentation, props.presentation),
    classMap: resolveClassMap(mergeClassMaps(classMap, props.classMap)),
    rootSchema: schema,
    // `F` may be narrower than `{}`, but an omitted formContext is an empty object
    formContext: props.formContext ?? ({} as F),
    schemaUtils,
    translateString,
    globalUiOptions: pickGlobalUiOptions(uiSchema?.[UI_GLOBAL_OPTIONS_KEY], props.globalUiOptionsKeys),
    globalFormOptions: getGlobalFormOptions(props),
    uiSchemaDefinitions: uiSchema?.[UI_DEFINITIONS_KEY] ?? {},
  };
}
