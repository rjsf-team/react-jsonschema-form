import type {
  ClassMap,
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

/** The class names `@rjsf/core`'s components render by default: Bootstrap 3's, which core's markup is written for */
const CLASS_MAP: MergedClassMap = {
  input: 'form-control',
  select: 'form-control',
  textarea: 'form-control',
  fileInput: 'form-control',
  rangeInput: 'form-control',
  rangeWrapper: '',
  checkboxWrapper: 'checkbox',
  checkboxLabel: '',
  checkboxInput: '',
  checkboxInlineLabel: 'checkbox-inline',
  radioWrapper: 'radio',
  radioLabel: '',
  radioInput: '',
  radioInlineLabel: 'radio-inline',
  disabled: 'disabled',
  altDateList: 'list-inline',
  altDateListItem: 'list-inline-item',
  altDateNowButton: 'btn btn-info',
  altDateClearButton: 'btn btn-warning',
  fieldLabel: 'control-label',
  labelError: '',
  fieldErrors: 'bs-callout bs-callout-info',
  fieldError: 'text-danger',
  fieldHelp: 'help-block',
  helpError: '',
  fieldDescription: '',
  descriptionError: '',
  errorList: 'panel panel-danger',
  errorListHeading: 'panel-heading',
  errorListTitle: 'panel-title',
  errorListItems: 'list-group',
  errorListItem: 'list-group-item text-danger',
  arrayFieldset: '',
  arrayItemList: 'row',
  arrayItem: '',
  arrayItemToolbox: '',
  objectFieldset: '',
  multiSchema: 'panel panel-default panel-body',
  multiSchemaSelector: 'form-group',
  cyclicSchemaMessage: 'text-danger',
  cyclicSchemaExpandButton: 'btn btn-sm btn-warning',
  optionalDataAddButton: 'btn-sm',
  optionalDataRemoveButton: 'btn-sm',
  submitButton: 'btn btn-info',
};

/** The core theme: every field, widget and template `@rjsf/core` implements, which parts of a field they draw, and the
 * class names they render
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

/** Layers `ClassMap`s key by key, the last on top. An entry left `undefined`, as a conditional one is, keeps the class
 * beneath it rather than rendering "undefined"
 */
export function mergeClassMaps(...layers: readonly (ClassMap | undefined)[]): ClassMap {
  return Object.fromEntries(
    layers.flatMap((layer) => Object.entries(layer ?? {})).filter(([, value]) => value !== undefined),
  );
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
    classMap: mergeClassMaps(classMap, props.classMap) as MergedClassMap,
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
