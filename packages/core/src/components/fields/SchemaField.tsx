import { use, useCallback, useMemo, memo } from 'react';
import type { ReactElement } from 'react';
import type {
  ErrorSchema,
  Field,
  FieldPath,
  FieldPresentation,
  PartPresentation,
  FieldProps,
  FieldTemplateProps,
  FormContextType,
  GlobalFormOptions,
  GlobalUISchemaOptions,
  ONE_OF_KEY,
  Registry,
  RJSFMarkedSchema,
  RJSFSchema,
  SchemaUtilsType,
  StrictRJSFSchema,
  UIOptionsType,
  UiSchema,
} from '@rjsf/utils';
import {
  ANY_OF_KEY,
  besideOptionsId,
  expandRefCycle,
  fieldPathToList,
  getDeprecatedHandling,
  getDescribedControlAttributes,
  getDiscriminatorFieldFromSchema,
  getFieldClassNames,
  getFieldLabel,
  getFieldTypeForWidget,
  getSchemaOwnTypes,
  getSchemaType,
  getSelectFieldType,
  getTemplates,
  getUiOptions,
  getUnionTypes,
  getXxxOfKey,
  GUESSED_TYPE_FLAG,
  guessType,
  hasOwnContentBesideOptions,
  isComponentType,
  isConstant,
  isConstantOptionList,
  isConstantSelect,
  isFormDataAvailable,
  isLabelledByTemplate,
  logOnce,
  omitConsumedStyling,
  rendersOwnFieldBesideOption,
  resolveUiSchema,
  RJSF_REF_CYCLE_KEY,
  shouldRenderOptionalField,
  toConstant,
  UI_FIELD_KEY,
  UI_OPTIONS_KEY,
  UI_WIDGET_KEY,
  uiBooleanOption,
} from '@rjsf/utils';

import fieldLabelForLog, { entryLabelForLog } from '../../fieldLabelForLog.ts';
import hasOptionLabels from '../../hasOptionLabels.ts';
import { useShownOption } from '../../hooks/useOptionSelection.ts';
import useSendBlur from '../../hooks/useSendBlur.ts';
import useUiState from '../../hooks/useUiState.ts';
import { retrievedOptionsOf } from '../uiState.ts';
import UiStateContext from '../UiStateContext.ts';
import AdditionalPropertyDepthsContext from './AdditionalPropertyDepthsContext.ts';
import {
  getDeprecatedTemplateProps,
  getFieldErrorProps,
  getTemplateParts,
  withoutAdditionalFlag,
  withoutDescribers,
} from './fieldWidgetUtils.ts';
import { lookUpUiField, resolveNamedField, withoutNamedField } from './namedField.ts';
import type { NamedFieldResolution } from './namedField.ts';
import NamedFieldContext from './NamedFieldContext.ts';
import type { NamedFieldPath } from './NamedFieldContext.ts';
import OptionalControlsBesideContext from './OptionalControlsBesideContext.ts';
import PresentationContext, { useInheritedPresentation } from './PresentationContext.ts';
import { useSelectorsAbove } from './SelectorsAboveContext.ts';
import ShownOptionContext from './ShownOptionContext.ts';
import TemplateWarnEntryContext from './TemplateWarnEntryContext.ts';
import useAdditionalDepths from './useAdditionalDepths.ts';
import useSchemaFieldPresentation from './useSchemaFieldPresentation.ts';

/** The map of component type to FieldName */
const COMPONENT_TYPES: Record<string, string> = {
  array: 'ArrayField',
  boolean: 'BooleanField',
  integer: 'NumberField',
  number: 'NumberField',
  object: 'ObjectField',
  string: 'StringField',
  null: 'NullField',
};

/** What `SchemaField` needs to know about a retrieved schema that may be a select */
interface SelectSchemaInfo<S extends StrictRJSFSchema> {
  /** The retrieved schema, with a `type` inferred from its constants when it is a typeless `oneOf`/`anyOf` select */
  schema: S;
  /** Whether the `type` was inferred rather than declared */
  hasInferredType: boolean;
  /** The keyword the schema's options are read from, if it has any */
  xxxOfKey: typeof ANY_OF_KEY | typeof ONE_OF_KEY | undefined;
  /** The non-empty constant options of that keyword, when they all are constants */
  constantOptions: S[] | undefined;
  /** Whether the schema is an `enum` or a `oneOf`/`anyOf` of constants, empty or not, see `isConstantSelect()` */
  isSelectSchema: boolean;
  /** Whether that select offers at least one option */
  hasConstantOptions: boolean;
}

/** Works out whether a retrieved schema is a select, reading its options from the same keyword `isSelect()` and
 * `optionsList()` read. A `oneOf`/`anyOf` whose options are all constants renders as a select through the field for the
 * schema's `type`, but JSON Schema doesn't require that `type`, and without it neither a field nor a widget can be
 * resolved, so it is inferred from the constant values.
 *
 * @param retrievedSchema - The retrieved schema for the field
 * @returns - The `SelectSchemaInfo` for the schema
 */
function getSelectSchemaInfo<S extends StrictRJSFSchema = RJSFSchema>(retrievedSchema: S): SelectSchemaInfo<S> {
  const xxxOfKey = getXxxOfKey<S>(retrievedSchema);
  const options = xxxOfKey && retrievedSchema[xxxOfKey];
  const constantOptions = isConstantOptionList<S>(options, true) ? options : undefined;
  let schema = retrievedSchema;
  if (constantOptions && getSchemaType<S>(retrievedSchema) === undefined) {
    // `toConstant()` throws for an option that isn't a constant, which is why only a list of them is mapped
    const types = [...new Set(constantOptions.map((option) => guessType(toConstant<S>(option))))];
    schema = { ...retrievedSchema, type: getSelectFieldType(types) };
  }
  return {
    schema,
    hasInferredType: schema !== retrievedSchema,
    xxxOfKey,
    constantOptions,
    // The schema is already retrieved, so it's checked directly rather than through `isSelect()`, which would resolve
    // it again. As for `isSelect()`, an empty `enum` or `oneOf`/`anyOf` still counts as a select, so it renders as a
    // select with nothing to choose rather than as an option selector with no options. A list already found to be all
    // constants isn't scanned again, which a long one makes worth skipping
    isSelectSchema: constantOptions !== undefined || isConstantSelect<S>(schema, true),
    hasConstantOptions: constantOptions !== undefined || isConstantSelect<S>(schema),
  };
}

/** Returns the widget to default the `uiSchema` of a `oneOf`/`anyOf` select to when the field for its `type` wouldn't
 * render a select on its own. That is only ever BooleanField, which defaults to a checkbox, and a checkbox ignores
 * `enumOptions` and so drops the option labels. Defaulting the widget rather than the type keeps `schema.type` truthful
 * for custom fields, templates and widgets.
 *
 * @param selectSchemaInfo - The `SelectSchemaInfo` of the retrieved schema for the field
 * @param uiSchema - The resolved `uiSchema` for the field, which may label the options
 * @returns - The widget name, or undefined when the field's own default suits the select
 */
function inferSelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(selectSchemaInfo: SelectSchemaInfo<S>, uiSchema: UiSchema<T, S, F>): string | undefined {
  const { schema, hasInferredType, xxxOfKey: keyword, constantOptions: options } = selectSchemaInfo;
  if (!keyword || !options || getSchemaType<S>(schema) !== 'boolean') {
    return undefined;
  }
  // An inferred boolean is a select, since nothing asked for a checkbox. A declared one keeps its checkbox unless a
  // label would be dropped, since a single option is how a checkbox that must be checked is spelled, and unlabelled
  // `true`/`false` options are exactly what a checkbox shows. A `null` option, which a nullable boolean can offer, is
  // one a checkbox has no state for, so it gets the select too. So does a type list naming `boolean` first among other
  // non-null types: `getFieldComponent()` renders it through StringField, and without a widget `getDisplayLabel()`
  // would still hide the label the way it does for a checkbox
  const needsSelect =
    hasInferredType ||
    (options.length > 1 &&
      (hasOptionLabels<T, S, F>(options, keyword, uiSchema) ||
        options.some((option) => toConstant<S>(option) === null) ||
        (Array.isArray(schema.type) && getSelectFieldType(schema.type) !== 'boolean')));
  return needsSelect ? 'select' : undefined;
}

/** Returns the `uiSchema` a field is rendered with: its resolved `uiSchema` with the widget inferred for its select, if
 * any, written back. An inferred widget is only a default, so a widget the caller named through either spelling is
 * written back unchanged. `ui:widget` is the key that carries it because that is where the inferred default has to
 * land, and spreading leaves an existing key where the caller put it, so the order `getUiOptions()` reduces in — and
 * with it `ui:widget` against `ui:options.widget` — is untouched either way.
 *
 * @param resolvedUiSchema - The field's `uiSchema`, as the field it names, if any, reads it
 * @param inferredWidget - The widget `inferSelectWidget()` inferred, if any
 * @param fields - The registered fields
 * @returns - The `uiSchema` the field is rendered with
 */
function withInferredWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  resolvedUiSchema: UiSchema<T, S, F>,
  inferredWidget: string | undefined,
  fields: Registry<T, S, F>['fields'],
): UiSchema<T, S, F> {
  if (!inferredWidget) {
    return resolvedUiSchema;
  }
  const rawUiField = lookUpUiField<T, S, F>(resolvedUiSchema[UI_FIELD_KEY], fields);
  // `BooleanField` is the only field the widget is ever inferred for, and the only one that reads it, so another field
  // named through `ui:field` is handed the caller's `uiSchema` without a widget it never chose — which a field following
  // `BooleanField`'s lead would otherwise render in place of its own default. A field named through `ui:options.field`
  // still gets the widget, so one that wraps `BooleanField` keeps its select, as does whichever field renders in place of
  // a `ui:field` that names nothing, as though none were given
  if (isComponentType(rawUiField) && rawUiField !== fields.BooleanField) {
    return resolvedUiSchema;
  }
  const callerWidget = resolvedUiSchema[UI_WIDGET_KEY] ?? resolvedUiSchema[UI_OPTIONS_KEY]?.widget;
  return { ...resolvedUiSchema, [UI_WIDGET_KEY]: callerWidget ?? inferredWidget };
}

/** Wraps `compute` so that, as a `useMemo()` would, it computes again only once an argument differs, by `Object.is()`,
 * from those of its last call, and otherwise hands back that call's result
 *
 * @param compute - The function to wrap
 * @returns - The wrapped function
 */
function memoizeLast<A extends unknown[], R>(compute: (...args: A) => R): (...args: A) => R {
  let last: { args: A; result: R } | undefined;
  return (...args) => {
    const previous = last;
    if (previous && args.every((arg, index) => Object.is(arg, previous.args[index]))) {
      return previous.result;
    }
    const result = compute(...args);
    last = { args, result };
    return result;
  };
}

/** What a field's widget and `deprecatedHandling` resolve to, and what they are resolved from */
interface FieldWidgetPlan<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The `SelectSchemaInfo` of the retrieved schema */
  selectSchemaInfo: SelectSchemaInfo<S>;
  /** The field the `uiSchema` or the schema's `$id` names, as `resolveNamedField()` resolved it, unless the schema is a
   * `$ref` cycle, which `CyclicSchemaField` renders before any field is read */
  uiField: NamedFieldResolution<T, S, F> | undefined;
  /** The `uiSchema` the field is rendered with */
  uiSchema: UiSchema<T, S, F>;
  /** The field's own UI options */
  ownUiOptions: UIOptionsType<T, S, F>;
  /** The field's own UI options over the global ones */
  uiOptions: UIOptionsType<T, S, F>;
  /** How the field handles its schema being `deprecated` */
  deprecatedHandling: ReturnType<typeof getDeprecatedHandling>;
  /** Whether the field renders hidden */
  hidden: boolean;
}

/** Creates the function a field's widget and `deprecatedHandling` are resolved by, from the props its `SchemaField` is
 * handed. `useSchemaFieldPlan()` resolves its field through one, and `createIsSchemaFieldHidden()` through another for
 * a container laying out a field it has not rendered yet, so the two cannot take different steps. As `useMemo()`s would,
 * each step runs again only once its own inputs change, so the `uiSchema` keeps its identity as the form data changes,
 * and a `uiSchema` rebuilt on every render neither retrieves the schema again nor hands a typeless select a new `schema`.
 * The caller tells it whether the schema is a `$ref` cycle, which it neither retrieves nor resolves a named field for
 *
 * @returns - The resolver, `resolve`, which keeps each step's last result, so each field is resolved through one of its
 *            own, and its `resolveUiSchema()` step, `resolveOwnUiSchema`, for a caller that reads the resolved
 *            `uiSchema` ahead of the rest without resolving it a second time
 */
function createFieldWidgetResolver<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>() {
  const resolveOwnUiSchema = memoizeLast(resolveUiSchema<T, S, F>);
  // Kept apart from inferring the select type so that a `uiSchema` rebuilt on every render doesn't retrieve again
  const retrieveSchema = memoizeLast(
    (isRefCycle: boolean, schema: S, formData: T | undefined, schemaUtils: SchemaUtilsType<T, S, F>) =>
      isRefCycle ? schema : schemaUtils.retrieveSchema(schema, formData),
  );
  // Kept apart from the widget below, which alone reads the `uiSchema`, so a `uiSchema` rebuilt on every render doesn't
  // hand a typeless select a new `schema` each time
  const selectSchemaInfoOf = memoizeLast(getSelectSchemaInfo<S>);
  // Below a field named for this same path, nothing names one again. Keyed on the `$id` rather than the schema, which is
  // retrieved afresh as the data changes, so the `uiSchema` it hands back keeps its identity
  const resolveUiField = memoizeLast(
    (
      isRefCycle: boolean,
      namedAbove: boolean,
      ownUiSchema: UiSchema<T, S, F>,
      schemaId: string | undefined,
      fields: Registry<T, S, F>['fields'],
      fieldPath: FieldPath,
      globalFormOptions: GlobalFormOptions,
    ): NamedFieldResolution<T, S, F> | undefined => {
      if (isRefCycle) {
        return undefined;
      }
      return namedAbove
        ? { ignored: [], uiSchema: withoutNamedField<T, S, F>(ownUiSchema) }
        : resolveNamedField<T, S, F>(ownUiSchema, schemaId, fields, fieldPath, globalFormOptions);
    },
  );
  const inferWidget = memoizeLast(inferSelectWidget<T, S, F>);
  // Kept apart from the schema above so that the resolved `uiSchema` keeps its identity as the form data changes
  const writeBackWidget = memoizeLast(withInferredWidget<T, S, F>);
  const readOwnUiOptions = memoizeLast((uiSchema: UiSchema<T, S, F>) => getUiOptions<T, S, F>(uiSchema));
  // What `getUiOptions(uiSchema, globalUiOptions)` returns, without reading the `uiSchema`'s keys a second time
  const overGlobalUiOptions = memoizeLast(
    (
      globalUiOptions: GlobalUISchemaOptions | undefined,
      ownUiOptions: UIOptionsType<T, S, F>,
    ): UIOptionsType<T, S, F> => ({
      ...globalUiOptions,
      ...ownUiOptions,
    }),
  );
  const resolve = (
    schema: S,
    rawUiSchema: UiSchema<T, S, F> | undefined,
    formData: T | undefined,
    fieldPath: FieldPath,
    registry: Registry<T, S, F>,
    isRefCycle: boolean,
    namedAbove: boolean,
  ): FieldWidgetPlan<T, S, F> => {
    const { schemaUtils, globalFormOptions, globalUiOptions, fields } = registry;
    const ownUiSchema = resolveOwnUiSchema(schema, rawUiSchema, registry);
    const selectSchemaInfo = selectSchemaInfoOf(retrieveSchema(isRefCycle, schema, formData, schemaUtils));
    const uiField = resolveUiField(
      isRefCycle,
      namedAbove,
      ownUiSchema,
      selectSchemaInfo.schema.$id,
      fields,
      fieldPath,
      globalFormOptions,
    );
    const resolvedUiSchema = uiField?.uiSchema ?? ownUiSchema;
    const uiSchema = writeBackWidget(resolvedUiSchema, inferWidget(selectSchemaInfo, resolvedUiSchema), fields);
    const ownUiOptions = readOwnUiOptions(uiSchema);
    const uiOptions = overGlobalUiOptions(globalUiOptions, ownUiOptions);
    const deprecatedHandling = getDeprecatedHandling<T, S, F>(selectSchemaInfo.schema, uiOptions);
    const hidden = ownUiOptions.widget === 'hidden' || deprecatedHandling === 'hide';
    return { selectSchemaInfo, uiField, uiSchema, ownUiOptions, uiOptions, deprecatedHandling, hidden };
  };
  return { resolve, resolveOwnUiSchema };
}

/** Creates the function a container tells by whether the `SchemaField` it hands `schema`, `uiSchema` and `formData`
 * renders hidden, for a field it lays out before rendering it, as `ObjectField` does for its `ObjectFieldTemplate`. The
 * field is resolved through `createFieldWidgetResolver()`, as `useSchemaFieldPlan()` resolves it, for a field nothing
 * above it names. A `$ref` cycle is resolved as the field it expands to, one level further: `CyclicSchemaField` renders
 * that field once the cycle is expanded, and nothing in place of its Expand button while that field renders hidden, so
 * the answer is the same either way. It models core's `SchemaField` and `CyclicSchemaField`, not a replacement
 * registered in `registry.fields`, which has to keep its `FieldTemplate`'s `hidden` in step itself
 *
 * @returns - The function, which keeps each step's last result, so a caller keeps one per field it checks
 */
export function createIsSchemaFieldHidden<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>() {
  const expandCycle = memoizeLast(expandRefCycle<S>);
  // The resolver only ever writes back the widget the `uiSchema` names through either spelling and never changes the
  // handling, so a field whose `uiSchema` and the global options name neither a hidden widget nor a `'hide'` is visible
  // without expanding or retrieving. Any other field is retrieved here as well as by its own `SchemaField`, deprecated
  // or not, so under a global `'hide'` this skips only a field whose `uiSchema` (its `ui:definitions` entry included)
  // sets another `deprecatedHandling`
  const mayHide = memoizeLast(
    (ownUiSchema: UiSchema<T, S, F>, globalUiOptions: GlobalUISchemaOptions | undefined) =>
      ownUiSchema[UI_WIDGET_KEY] === 'hidden' ||
      ownUiSchema[UI_OPTIONS_KEY]?.widget === 'hidden' ||
      getUiOptions<T, S, F>(ownUiSchema, globalUiOptions).deprecatedHandling === 'hide',
  );
  const { resolve: resolveFieldWidget, resolveOwnUiSchema } = createFieldWidgetResolver<T, S, F>();
  // An expansion keeps the `$ref` that picks the field's `ui:definitions` entry, so a cycle is shortcut before it is
  // expanded. Kept apart from the resolver's step, which resolves the expansion, so the two don't evict each other
  const resolveCycleUiSchema = memoizeLast(resolveUiSchema<T, S, F>);
  /** Tells whether the field renders hidden
   *
   * @param schema - The field's schema, as handed to its `SchemaField`
   * @param uiSchema - The field's uiSchema, as handed to its `SchemaField`
   * @param formData - The field's data
   * @param fieldPath - The field's path
   * @param registry - The registry
   * @returns - True when the field renders hidden
   */
  return (
    schema: S,
    uiSchema: UiSchema<T, S, F> | undefined,
    formData: T | undefined,
    fieldPath: FieldPath,
    registry: Registry<T, S, F>,
  ): boolean => {
    const isRefCycle = Boolean((schema as RJSFMarkedSchema)[RJSF_REF_CYCLE_KEY]);
    const ownUiSchema = isRefCycle
      ? resolveCycleUiSchema(schema, uiSchema, registry)
      : resolveOwnUiSchema(schema, uiSchema, registry);
    if (!mayHide(ownUiSchema, registry.globalUiOptions)) {
      return false;
    }
    const fieldSchema = isRefCycle ? expandCycle(schema, registry.schemaUtils.getRootSchema()) : schema;
    // An expansion carries no cycle flag, and nothing above the field names one for it
    return resolveFieldWidget(fieldSchema, uiSchema, formData, fieldPath, registry, false, false).hidden;
  };
}

const RenderNothing = () => null;

/** Computes and returns which `Field` implementation to return in order to render the field represented by the
 * `schema`. The `uiOptions` are used to alter what potential `Field` implementation is actually returned. If no
 * appropriate `Field` implementation can be found then a wrapper around `UnsupportedFieldTemplate` is used.
 *
 * @param schema - The schema from which to obtain the type
 * @param uiOptions - The field's own UI Options that may affect the component decision
 * @param namedField - The field `resolveNamedField()` resolved, if one is named
 * @param namedFieldKey - The registry key that field was named by, if it was named by one
 * @param registry - The registry from which fields and templates are obtained
 * @param xxxOfKey - The keyword the `schema`'s options are read from, if it has any
 * @param isSelectSchema - Whether the `schema` is an `enum` or a `oneOf`/`anyOf` that represents a select
 * @param hasConstantOptions - Whether that select offers at least one option, see `isConstantSelect()`
 * @returns - The `Field` component that renders the actual field data, whether that component renders the `schema`'s
 *            `anyOf`/`oneOf` options itself, and whether the `schema` has options for `SchemaFieldRender` to render an
 *            option selector of. Both flags are decided here so that this function and `SchemaFieldRender` read the
 *            same answers, and `SchemaFieldRender` reads them together: when the fallback UI has the schema it renders
 *            those options itself, within the value field for the type it has pinned, so the selector it would render
 *            is left unrendered even though the schema calls for one. Also whether that component is a named field
 *            written for the schema, which `FallbackField` is not, the component that renders the field, even when it
 *            is withheld for the options, and the registry key that named it, which the field is planned by
 */
function getFieldComponent<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiOptions: UIOptionsType<T, S, F>,
  namedField: Field<T, S, F> | undefined,
  namedFieldKey: string | undefined,
  registry: Registry<T, S, F>,
  xxxOfKey: typeof ANY_OF_KEY | typeof ONE_OF_KEY | undefined,
  isSelectSchema: boolean,
  hasConstantOptions: boolean,
): {
  FieldComponent: Field<T, S, F>;
  rendersNamedField: boolean;
  rendersOptionsItself: boolean;
  rendersOptionSelector: boolean;
  optionsGiveWayToField: boolean;
  yieldsToOptions: boolean;
  isWithheld: boolean;
  fieldKey: string | undefined;
  handsDownOwnParts: boolean;
} {
  const { widget } = uiOptions;
  const { fields, globalFormOptions } = registry;

  // A select's options pin its value, so a select whose declared type list names several non-null types is rendered
  // by StringField, which keeps each option's value as it is, and one naming a single non-null type by that type's
  // field. The first listed type's field would leave `null` blank, or cast every other option's value to its own type
  // the way NumberField turns `true` into `1`. Any other type list renders the field of another type it names when only
  // that type has the widget it renders with: a `textarea` on a `['null', 'number', 'string']` is rendered by
  // `StringField`, which keeps the `'007'` typed into it as it is rather than casting it to `7` the way `NumberField`
  // would. `getFieldTypeForWidget()` answers both, so `getDisplayLabel()` and the defaults agree with the field
  const type = getFieldTypeForWidget<S>(schema, widget) ?? '';

  // Looked up as an own property, for the reason `lookUpUiField()` looks the `ui:field` up that way: a `type` such
  // as `constructor` or `toString` would otherwise resolve to something off `Object.prototype` rather than to no field
  let componentName = Object.hasOwn(COMPONENT_TYPES, type) ? COMPONENT_TYPES[type] : '';
  // ObjectField and ArrayField edit a value's contents rather than choosing between values, so a select over object or
  // array constants, spelled as an `enum` or a `oneOf`/`anyOf`, is rendered by the field that renders every other
  // select, while `schema.type` stays as declared. An empty list offers nothing to choose, so the object or array is
  // still edited through its own field
  if ((type === 'object' || type === 'array') && hasConstantOptions) {
    componentName = 'StringField';
  }
  // A schema that allows more than one type, or whose type was guessed from the form data of an `additionalProperties`
  // entry the schema puts no constraint on, has no one field that can render every type it accepts. `FallbackField`
  // renders a selector for choosing which of them to enter, so it takes over whenever that opt-in UI is enabled.
  // An `anyOf`/`oneOf` is kept, and the fallback UI wraps it: the value schema it builds pins the type but carries the
  // options along, so the option selector renders within the type selector rather than instead of it, and every member
  // of the union stays reachable from inside an option.
  // A select is left alone, since its options are constants that pin the value; an `enum` or `const` is left alone for
  // the same reason, as switching type would cast a value the user picked into one the schema rejects and leave a
  // select still offering values of the old type.
  // A `ui:widget` given as a component is left alone too, for the same reason a `ui:field` is: the caller wrote a
  // control for this very schema, unions included, so wrapping it in a type selector that pins the type and casts the
  // value on every switch would take away what it was written to do. A widget named by string is a theme's control for
  // one type, which is the choice the selector is there to make, so `getValueUiSchema()` carries it down instead.
  // A schema with a guessed type still gets the selector whatever the widget is: it lists no types for such a control
  // to handle, so the widget renders within it for the chosen one
  const hasGuessedType = GUESSED_TYPE_FLAG in schema;
  const isNamedWidget = !widget || typeof widget === 'string';
  const isDivertedToFallbackUi =
    globalFormOptions.useFallbackUiForUnsupportedType &&
    (isNamedWidget || hasGuessedType) &&
    !isSelectSchema &&
    !schema.enum &&
    !isConstant<S>(schema) &&
    (getUnionTypes<S>(schema) !== undefined || hasGuessedType);
  if (isDivertedToFallbackUi) {
    componentName = 'FallbackField';
  }

  /** The one component every answer below is derived from, so that none of them can describe another: the named
   * field, or the field the type settled on a name for, or the fallback UI for a name no field is registered under — an
   * unrecognized `type`, or no type at all
   */
  const isRegisteredName = Object.hasOwn(fields, componentName);
  const FieldComponent = namedField ?? (isRegisteredName ? fields[componentName] : fields.FallbackField);
  let fieldKey = namedFieldKey;
  if (!namedField) {
    fieldKey = isRegisteredName ? componentName : 'FallbackField';
  }
  /** Whether the component is this very field, whatever named it — the type having no field of its own, the opt-in
   * diverting a union, or a `ui:field` or `$id`. What it renders depends on the opt-in; that it is not a field written
   * for the schema does not
   */
  const isFallbackField = FieldComponent === fields.FallbackField;
  /** `FallbackField` is the fallback UI only with the opt-in on; without it the component renders the unsupported field
   * template, which takes no `anyOf`/`oneOf` over
   */
  const rendersFallbackUi = isFallbackField && Boolean(globalFormOptions.useFallbackUiForUnsupportedType);
  /** A named field is the field `ui:fieldReplacesAnyOrOneOf` asks the options to give way to. When none resolves
   * there is nothing to give way to and the options are rendered, which is what lets the form be completed: without
   * them an object union loses the `properties` of every option.
   * One naming this field is not a field the options can give way to either: with the opt-in on what it would add is a
   * type selector, which is the choice the options already offer, and without it an unsupported-field box in their
   * place
   */
  const optionsGiveWayToField =
    namedField !== undefined && !isFallbackField && uiOptions.fieldReplacesAnyOrOneOf === true;
  /** An `anyOf`/`oneOf` that represents a select is rendered by the field for the schema's type as one control, rather
   * than by an option selector
   */
  const rendersOptionSelector = xxxOfKey !== undefined && !isSelectSchema && !optionsGiveWayToField;
  /** The types the schema says its value has, read only where the answer can matter — the two flags are what the one
   * reader below already requires, so they keep `getSchemaOwnTypes()` off the path of every ordinary union in every
   * form without the opt-in
   */
  const ownTypes = rendersFallbackUi && rendersOptionSelector ? getSchemaOwnTypes<S>(schema) : undefined;
  /** Whether the option selector is the only choice of type there is, because the schema names no type of its own for a
   * type selector to offer one of. An option naming its own type overrides whatever a type selector pinned, so such a
   * selector would leave the screen as it was while `castToNewType()` rewrote the value on every switch. What the
   * schema names is read from the schema rather than from how the fallback UI was reached, so that a named field gets
   * the same answer as the schema's own type having no field of its own
   */
  const optionsSupplyTheTypes = rendersFallbackUi && rendersOptionSelector && ownTypes === undefined;
  /** Whether the value field the fallback UI would render the options within holds nothing for them to describe. A
   * `null` is the whole of the value it describes, so `getValueSchema()` drops the options once that is the type in
   * effect; with `null` the only type the schema allows there is no selector to choose another, so the options are
   * dropped for good and the field that was to render them renders nothing at all
   */
  const optionsHaveNoValueToRenderWithin = ownTypes?.length === 1 && ownTypes[0] === 'null';
  /** Whether the fallback UI renders this schema's options itself, within the value field for the type it has pinned */
  const rendersOptionsItself = rendersFallbackUi && !optionsSupplyTheTypes && !optionsHaveNoValueToRenderWithin;

  // If the schema uses 'anyOf' or 'oneOf' and is not a pure select (all-constant options),
  // let the MultiSchemaField component handle the form display entirely.
  // ObjectField is excluded: it renders shared properties (defined at the parent schema
  // level) alongside the XxxOfField option selector.
  // All other field types — including primitives and arrays — have no shared renderable
  // properties, so the outer FieldComponent would only produce a spurious duplicate input.
  // A schema whose options the fallback UI renders is excluded alongside ObjectField, since returning nothing here
  // would drop its type selector and the options with it.
  // A named field is excluded too: a field written for this schema renders beside the options. This field is not,
  // whether it was named or reached by the schema's own type having no field, since what it would add is the type
  // selector the options replace.
  // A schema that lists its types keeps that selector even though a typed option overrides it there too, which is the
  // asymmetry #5390 is about
  const yieldsToOptions =
    rendersOptionSelector && !rendersOptionsItself && (namedField === undefined || isFallbackField);
  /** A named field written for the schema, which never yields to the options */
  const rendersNamedField = namedField !== undefined && !isFallbackField;

  const isWithheld = yieldsToOptions && FieldComponent !== fields.ObjectField;
  /** A field the form's author supplies, through a `ui:field` or a `$id`, may render `SchemaField` under its own id
   * without drawing the parts it was planned to draw itself, as a wrapper adding markup around the field does, so it
   * hands those parts down to the field below rather than keeping them. The fallback UI and the option fields relay
   * the plan to a field below that way and draw those parts themselves, and `ObjectField` and `ArrayField`, which a
   * `ui:field` can name too, draw their heading and description themselves, which the option beside them compares its
   * own with
   */
  const handsDownOwnParts =
    rendersNamedField &&
    FieldComponent !== fields.AnyOfField &&
    FieldComponent !== fields.OneOfField &&
    FieldComponent !== fields.ObjectField &&
    FieldComponent !== fields.ArrayField;
  return {
    FieldComponent: isWithheld ? RenderNothing : FieldComponent,
    rendersNamedField,
    // `yieldsToOptions` requires `!rendersOptionsItself`, so the flags read the same whether or not the field is withheld
    rendersOptionsItself,
    rendersOptionSelector,
    optionsGiveWayToField,
    yieldsToOptions,
    isWithheld,
    fieldKey,
    handsDownOwnParts,
  };
}

/** Plans the component that renders a field `createFieldWidgetResolver()` resolved, `SchemaField` named for its own data
 * counting as no field named, since it renders that data with none. Undefined for a `$ref` cycle, which names no field
 *
 * @param resolved - The field as `createFieldWidgetResolver()` resolved it
 * @param registry - The registry from which fields are obtained
 * @returns - What `getFieldComponent()` plans for the field, or undefined for a `$ref` cycle
 */
function planFieldComponent<T, S extends StrictRJSFSchema, F extends FormContextType>(
  {
    selectSchemaInfo,
    uiField,
    ownUiOptions,
  }: Pick<FieldWidgetPlan<T, S, F>, 'selectSchemaInfo' | 'uiField' | 'ownUiOptions'>,
  registry: Registry<T, S, F>,
) {
  if (!uiField) {
    return undefined;
  }
  const { schema, xxxOfKey, isSelectSchema, hasConstantOptions } = selectSchemaInfo;
  const namedField = uiField.namedField === registry.fields.SchemaField ? undefined : uiField.namedField;
  return getFieldComponent<T, S, F>(
    schema,
    ownUiOptions,
    namedField,
    uiField.namedFieldKey,
    registry,
    xxxOfKey,
    isSelectSchema,
    hasConstantOptions,
  );
}

/** Whether a field planned as `plan` draws its Optional Data Controls beside the `anyOf`/`oneOf` options it renders
 * itself, keeping the selected option off screen until Add: its own `ObjectField` renders beside them, which a pure
 * union, an object with nothing of its own beside its options, doesn't. Whether the controls apply to the field at all
 * is `shouldRenderOptionalField()`'s to say
 *
 * @param plan - What `getFieldComponent()` planned for the field
 * @param fields - The registered fields
 * @param hasOwnContent - Whether the object has content of its own beside its options, see
 *        `hasOwnContentBesideOptions()`, asked only where that decides it
 * @returns - True when the field's `ObjectField` draws the controls beside its options
 */
function drawsControlsBesideOwnOptions<T, S extends StrictRJSFSchema, F extends FormContextType>(
  plan: ReturnType<typeof getFieldComponent<T, S, F>>,
  fields: Registry<T, S, F>['fields'],
  hasOwnContent: () => boolean,
): boolean {
  return (
    plan.rendersOptionSelector &&
    !plan.rendersOptionsItself &&
    !plan.isWithheld &&
    plan.FieldComponent === fields.ObjectField &&
    (!plan.yieldsToOptions || hasOwnContent())
  );
}

/** Whether the object field at `fieldPath` draws its Optional Data Controls beside its `anyOf`/`oneOf` options, for the
 * `ui:required` walk, which has to leave out the selected option they keep off screen. The field is planned as
 * `useSchemaFieldPlan()` plans it, through the same resolver, for a field nothing above it names. Where it doesn't render
 * the options itself, the field below it at the same path does, planned with no field named: the fallback UI's value
 * field, with the object's type pinned, or the field a named one renders its data through under
 * `ui:fieldReplacesAnyOrOneOf`. It models core's `SchemaField`, not a replacement registered in `registry.fields`
 *
 * @param registry - The registry the form renders with
 * @param fieldPath - The field's path
 * @param schema - The object's schema, with the extra-key keywords of the option shown joined in
 * @param uiSchema - The object's uiSchema
 * @param formData - The object's form data
 * @param [isFieldBelow=false] - Whether this is the field below at the same path, planned with no field named
 * @returns - True when the object draws the controls beside its options
 */
export function schemaFieldDrawsControlsBesideOptions<T, S extends StrictRJSFSchema, F extends FormContextType>(
  registry: Registry<T, S, F>,
  fieldPath: FieldPath,
  schema: S,
  uiSchema: UiSchema<T, S, F>,
  formData: T | undefined,
  isFieldBelow = false,
): boolean {
  const resolved = createFieldWidgetResolver<T, S, F>().resolve(
    schema,
    uiSchema,
    formData,
    fieldPath,
    registry,
    false,
    isFieldBelow,
  );
  const plan = planFieldComponent<T, S, F>(resolved, registry);
  if (!plan) {
    return false;
  }
  if (plan.rendersOptionsItself || plan.optionsGiveWayToField) {
    return (
      !isFieldBelow &&
      schemaFieldDrawsControlsBesideOptions<T, S, F>(
        registry,
        fieldPath,
        plan.rendersOptionsItself ? { ...schema, type: getSchemaType<S>(schema) } : schema,
        uiSchema,
        formData,
        true,
      )
    );
  }
  return drawsControlsBesideOwnOptions<T, S, F>(plan, registry.fields, () =>
    hasOwnContentBesideOptions<T, S, F>(registry.schemaUtils, schema, resolved.uiSchema, formData),
  );
}

/** Gets a part of a field's plan with the field's own drawing of it taken away, so nothing draws a part the field was
 * planned to draw itself
 *
 * @param part - The part of the plan
 * @returns - The part, `none` where the field was to draw it
 */
function withoutOwnDrawing<P extends PartPresentation>(part: P): P {
  return part.by === 'self' ? { ...part, by: 'none' } : part;
}

/** Gets a field's label, description, help and errors with the field's own drawing of each taken away
 *
 * @param presentation - The field's plan
 * @returns - The four parts, each `none` where the field was to draw it
 */
function withoutOwnParts({ label, description, help, errors }: FieldPresentation) {
  return {
    label: withoutOwnDrawing(label),
    description: withoutOwnDrawing(description),
    help: withoutOwnDrawing(help),
    errors: withoutOwnDrawing(errors),
  };
}

/** Gets the plan a field the form's author supplies hands the field below it rendering the same id: the label,
 * description and help it was planned to draw itself are left to that field, which draws them, so a wrapper drawing
 * none of them doesn't leave its description drawn nowhere and named by its control's `aria-describedby`. The parts its
 * template draws stay above. Errors it was planned to draw itself are drawn by none, since a field below takes the
 * errors of the field above as drawn there, and its control is described by none of the ids of the parts handed down
 *
 * @param presentation - The plan of the field the author supplies
 * @returns - The plan the field below inherits
 */
function getPresentationHandedDown(presentation: FieldPresentation): FieldPresentation {
  const { label, description, help, errors } = presentation;
  const ownIds = new Set(
    [label, description, help, errors].filter((part) => part.by === 'self').map((part) => part.id),
  );
  if (ownIds.size === 0) {
    return presentation;
  }
  return { ...presentation, ...withoutOwnParts(presentation), ...withoutDescribers(presentation, ownIds) };
}

/** Gets the plan the field rendering a field component's options is handed when that component is not planned as it:
 * the parts the component draws itself are its own, such as a custom field's label or an object's heading, so the
 * options' selector draws none of them. A container's heading, which renders under the label id its plan gives it,
 * names the selector as a template's label would, and its description and errors describe it, marking it invalid while
 * they show. A custom field, or a layout grid, may render none of the ids its own parts take, so neither its label
 * nor the ids of the parts it draws itself name or describe the selector, or the option below that inherits this plan.
 * Only the control's attributes reach the selector, which takes an id of its own
 *
 * @param presentation - The plan of the field component the options render beside
 * @param id - The id of the field
 * @param isContainer - Whether that component is core's `ObjectField` or `ArrayField`, which draw their heading under
 *   the plan's label id
 * @returns - The plan of the field rendering the options
 */
function getOptionsPresentation(presentation: FieldPresentation, id: string, isContainer: boolean): FieldPresentation {
  if (!isContainer) {
    return getPresentationHandedDown(presentation);
  }
  const { label, errors, control, describedBy } = presentation;
  const parts = withoutOwnParts(presentation);
  if (control === undefined && label.by === 'self') {
    const attributes = getDescribedControlAttributes(describedBy, errors.messages);
    return { ...presentation, ...parts, label: { ...label, by: 'above' }, control: { id, attributes } };
  }
  return { ...presentation, ...parts };
}

/** Whether a field's label goes undrawn only because its template has no control for it to name, as an `anyOf`/`oneOf`
 * field's does while an optional data control keeps its option selector off screen
 *
 * @param plan - The field's plan
 * @returns - True when the field's label has text that `ui:label` shows but nothing draws for want of a control
 */
function isLabelUndrawnForLackOfControl({ label, control, showLabel }: FieldPresentation): boolean {
  return label.by === 'none' && control === undefined && showLabel && label.text !== '';
}

/** Resolves the field a `SchemaField` renders and plans who draws its parts, from the props it is handed and from the
 * fields above it rendering the same path or id. The array item holding a field plans it with the props it hands the
 * item's `SchemaField`, so the item's template is laid out by the plan the field's own template draws by
 *
 * @param props - The `FieldProps` the `SchemaField` is handed
 * @returns - The field `SchemaField` renders, the schema and `uiSchema` it renders it with, and its plan
 */
export function useSchemaFieldPlan<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F>) {
  const {
    schema: _schema,
    fieldPath,
    id: fieldId,
    uiSchema: _uiSchema,
    formData,
    errorSchema,
    name,
    required = false,
    registry,
    wasPropertyKeyModified = false,
  } = props;
  const { schemaUtils, globalUiOptions } = registry;
  const namedFieldAbove = use(NamedFieldContext);
  const namedHere = namedFieldAbove?.fieldPath === fieldPath ? namedFieldAbove : undefined;
  const namedAbove = namedHere !== undefined;
  const framedAbove = namedHere?.framedAbove === true;
  const optionsRenderedAbove = namedHere?.optionsRendered === true;

  // A `$ref` cycle returns below without rendering a field of its own, so the resolver neither retrieves its schema nor
  // resolves the field it names. Those are resolved up here, ahead of that return, because the options memo depends on
  // them. The resolver is the field's own, since it keeps each step's last result as a `useMemo()` would, and its
  // result is memoized as well because the React Compiler (`react/preserve-manual-memoization`) takes what a call
  // returns for a value that may still be mutated, and so refuses the memos below that depend on it
  const resolveFieldWidget = useMemo(() => createFieldWidgetResolver<T, S, F>().resolve, []);
  const isRefCycle = Boolean((_schema as RJSFMarkedSchema)[RJSF_REF_CYCLE_KEY]);
  const { selectSchemaInfo, uiField, uiSchema, ownUiOptions, uiOptions, deprecatedHandling, hidden } = useMemo(
    () => resolveFieldWidget(_schema, _uiSchema, formData, fieldPath, registry, isRefCycle, namedAbove),
    [resolveFieldWidget, _schema, _uiSchema, formData, fieldPath, registry, isRefCycle, namedAbove],
  );
  const { schema, xxxOfKey } = selectSchemaInfo;
  // Memoized so a child reading it past a `memo` boundary isn't re-rendered by a new object each render
  const fieldUiSchema = useMemo<UiSchema<T, S, F>>(() => omitConsumedStyling<T, S, F>(uiSchema), [uiSchema]);
  // The field's own options pick the field, since `getDisplayLabel()` and the defaults read only its own `ui:widget`
  const fieldToRender = planFieldComponent<T, S, F>({ selectSchemaInfo, uiField, ownUiOptions }, registry);
  // The fallback UI renders the options itself, against the schema with its type pinned to the one its selector is on,
  // so rendering them here as well would show the same option selector twice — once for the union and once for the
  // type in effect — and only the inner one would follow the type the user chose. Below a named field, the
  // `SchemaField` that named it may have rendered them already
  const retrievesOptions =
    !optionsRenderedAbove &&
    fieldToRender !== undefined &&
    fieldToRender.rendersOptionSelector &&
    !fieldToRender.rendersOptionsItself;

  // ui:required is deliberately resolved from this field's own uiSchema only (no globalUiOptions fallback): unlike
  // most ui:options, it has to be seen by getUiRequiredErrorSchema() too, which resolves a field's own uiSchema
  // uiSchema, so a form-wide default here would make the required indicator and schema validation disagree
  const uiRequired = uiBooleanOption(ownUiOptions.required);
  const effectiveRequired = uiRequired ?? required;
  // `ui:hideError` is resolved as the field's own, then the one the field above resolved to, so a parent's reaches its
  // children (#5490)
  const hideError = uiBooleanOption(ownUiOptions.hideError) ?? props.hideError;
  const inheritedPresentation = useInheritedPresentation(fieldId);
  // The property name and the title a parent hands down label the field above, which a selected option or the fallback
  // UI's value renders the value of, so a field below with no title of its own isn't labelled by them a second time
  // where a label outside the field above already shows them: its template's, or one drawn above it, a container's
  // heading included. A label the field above draws itself, such as a selector's, names another control, so the field
  // below keeps them for its own title
  const labelledAbove = inheritedPresentation !== undefined && isLabelledByTemplate(inheritedPresentation.plan);
  const labelSources = {
    name: labelledAbove ? undefined : name,
    title: labelledAbove ? undefined : props.title,
    unresolvedSchema: props.schema,
    wasPropertyKeyModified,
  };
  const ownLabel = getFieldLabel<T, S, F>(schema, uiOptions, registry.translateString, labelSources);
  const title = schema.deprecated
    ? getFieldLabel<T, S, F>({ ...schema, deprecated: false }, uiOptions, registry.translateString, labelSources)
    : ownLabel;
  // A field below titled as the field above says what that field's label says, so it takes that label, Deprecated
  // marker included, and its heading is recognised as the same one rather than kept for differing by the marker. A
  // field below with no title of its own takes it too, rather than the property name, whatever draws it: a label the
  // field above draws itself, as a selector's, names the selector, not this control, and a template label with no
  // control to name, as while an optional field's option selector isn't on screen, isn't drawn, so it is the field
  // below's heading
  let label = ownLabel;
  if (inheritedPresentation) {
    const untitled = !getFieldLabel<T, S, F>(schema, uiOptions, registry.translateString, {
      ...labelSources,
      name: undefined,
    });
    if (inheritedPresentation.title === title || untitled) {
      label = inheritedPresentation.plan.label.text;
    }
  }
  // When the option selector is an optional data control AND it does not have form data, the control is not on screen
  // yet. This is decided here rather than with the `XxxOfField` below because the fallback UI renders that same selector
  // for the type it has pinned, within its value field, and where this field's template labels the value, the plan the
  // value field inherits has it draw no label of its own, which leaves this the only field either label can come from
  const isOptedOut =
    fieldToRender !== undefined &&
    fieldToRender.rendersOptionSelector &&
    shouldRenderOptionalField<T, S, F>(registry, schema, effectiveRequired, uiSchema, fieldPath) &&
    !isFormDataAvailable<T>(formData);
  const schemaDescription = props.schema.description || schema.description || '';
  // A description a field below declares of its own, as a selected option does, says more about it than the one the
  // field above left undrawn, so it wins over that, though not over its own `ui:description`. The fallback UI's value
  // carries its field's own description, which is not its own
  const ownSchemaDescription =
    inheritedPresentation && schemaDescription !== inheritedPresentation.schemaDescription ? schemaDescription : '';
  // The description of a field above with no control to draw its parts by is left undrawn there, as its label is, so a
  // field below with none of its own draws it under the heading it takes from that label
  const descriptionUndrawnAbove =
    inheritedPresentation &&
    isLabelUndrawnForLackOfControl(inheritedPresentation.plan) &&
    inheritedPresentation.plan.description.by === 'none'
      ? inheritedPresentation.plan.description.text
      : '';
  const fieldDescription =
    ownUiOptions.description || ownSchemaDescription || descriptionUndrawnAbove || schemaDescription;
  // `ui:label` is resolved as `hideError` is, the field's own and then the one the field above rendering this id resolved
  // to, and only then `ui:globalOptions`, since an option given a `uiSchema` of its own doesn't carry the field's
  const showLabel =
    uiBooleanOption(ownUiOptions.label) ??
    inheritedPresentation?.plan.showLabel ??
    uiBooleanOption(globalUiOptions?.label) ??
    true;
  // When the options render, the field component renders beside them under an id of its own, to avoid DOM id
  // duplication with the rendering of the same data address by the `XxxOfField`, numbered by the selectors above for
  // this id, so an option rendering options of its own doesn't take the id of the component beside its field's. The
  // `fieldPath` stays the truthful data address either way
  const selectorsAbove = useSelectorsAbove(fieldId);
  const fieldComponentId = retrievesOptions
    ? besideOptionsId(fieldId, selectorsAbove.anyOf + selectorsAbove.oneOf + 1)
    : fieldId;
  // `MultiSchemaField` renders the options it is handed. Memoized so a re-render that changed neither the schema nor
  // the data hands it the same array, which its callbacks key on
  const xxxOfOptions = useMemo(
    () => (retrievesOptions ? retrievedOptionsOf<T, S, F>(schemaUtils, schema, formData) : undefined),
    [retrievesOptions, schema, schemaUtils, formData],
  );

  // The option shown is the form's state, which `AnyOfField`/`OneOfField` read and write too. An object renders its own
  // field beside the option, whose extra keys are stubbed once, with the selected option: a key the option declares is
  // left to it, and any other is described by the object's extra-key keywords and the option's together
  const { uiState, isOwn: ownsUiState } = useUiState();
  const { list, selectedOption, selectOption, keepSelection, editOwnProperty } = useShownOption<T, S, F>(
    uiState,
    registry,
    fieldPath,
    xxxOfOptions,
    formData,
    getDiscriminatorFieldFromSchema<S>(schema),
  );
  const shownOption = useMemo(
    () => (xxxOfOptions ? { fieldPath, options: xxxOfOptions, list, selectedOption, selectOption } : undefined),
    [xxxOfOptions, list, selectedOption, selectOption, fieldPath],
  );
  // The field below a named one is the field beside the options the `SchemaField` that named it renders. Read there
  // alone: the options are retrieved afresh with every change of the data, so a field reading them re-renders with
  // every keystroke in a field beside them, past its `memo`
  const fieldShownOption = optionsRenderedAbove ? use(ShownOptionContext) : shownOption;
  // An object below a named field stubs its extra keys with the option shown beside it there, as one rendering the
  // options does, so a key the option declares is left to the option rather than rendered twice
  const optionBeside = fieldShownOption?.selectedOption ?? -1;
  const fieldSchema = useMemo(
    () =>
      optionBeside >= 0 && rendersOwnFieldBesideOption<S>(schema)
        ? schemaUtils.retrieveSchema(_schema, formData, false, optionBeside)
        : schema,
    [optionBeside, schema, schemaUtils, _schema, formData],
  );
  // An object with nothing of its own to render beside its options, a pure union, is planned like a withheld field as
  // the field that renders its options, whose template labels it. `fieldSchema` carries the option shown, so an object
  // whose every option is closed stays a pure union however its own keywords read
  const isPureUnion =
    fieldToRender?.yieldsToOptions === true &&
    !hasOwnContentBesideOptions<T, S, F>(schemaUtils, fieldSchema, fieldUiSchema, formData);
  const plannedAsOptions = fieldToRender?.isWithheld === true || isPureUnion;
  const renderedComponent = fieldToRender?.FieldComponent;
  // The `SchemaField` that named the field takes its own errors out of the `errorSchema` it hands on, and passes them
  // to the field framed inside its template through the context, whatever the named field does with its `rawErrors`
  const ownErrors = framedAbove ? namedHere?.errors : errorSchema?.__errors;
  const { presentation, labelPlacement } = useSchemaFieldPresentation<T, S, F>({
    id: fieldId,
    // The parts the field draws itself render under its own id, unless it is planned as the field rendering the options
    componentId: plannedAsOptions ? undefined : fieldComponentId,
    registry,
    schema,
    uiSchema: fieldUiSchema,
    field: renderedComponent,
    fieldKey: fieldToRender?.fieldKey,
    xxxOfKey: plannedAsOptions ? xxxOfKey : undefined,
    label,
    showLabel,
    description: fieldDescription,
    help: ownUiOptions.help,
    errors: ownErrors,
    hideError,
    hidden: hidden || isOptedOut,
    required: effectiveRequired,
    inherited: inheritedPresentation?.plan,
  });
  // Planned here so an array item's own buttons lock exactly as its inputs do
  const disabled = Boolean(ownUiOptions.disabled ?? props.disabled) || deprecatedHandling === 'disable';
  const readonly = Boolean(ownUiOptions.readonly ?? (props.readonly || props.schema.readOnly || schema.readOnly));
  return {
    namedFieldAbove,
    namedAbove,
    framedAbove,
    schema,
    xxxOfKey,
    uiField,
    uiSchema,
    fieldUiSchema,
    ownUiOptions,
    uiOptions,
    fieldToRender,
    deprecatedHandling,
    uiRequired,
    effectiveRequired,
    hideError,
    hidden,
    title,
    label,
    schemaDescription,
    fieldComponentId,
    plannedAsOptions,
    renderedComponent,
    presentation,
    labelPlacement,
    ownErrors,
    xxxOfOptions,
    uiState,
    ownsUiState,
    keepSelection,
    editOwnProperty,
    shownOption,
    fieldShownOption,
    fieldSchema,
    disabled,
    readonly,
  };
}

/** The `SchemaFieldRender` component is the work-horse of react-jsonschema-form, determining what kind of real field to
 * render based on the `schema`, `uiSchema` and all the other props. It also deals with rendering the `anyOf` and
 * `oneOf` fields.
 *
 * @param props - The `FieldProps` for this component
 */
function SchemaFieldRender<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F>) {
  const {
    schema: _schema,
    fieldPath,
    id: fieldId,
    formData,
    errorSchema,
    name,
    onChange,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    keyNotAllowed,
    required = false,
    registry,
  } = props;
  const { fields } = registry;
  const { AnyOfField: _AnyOfField, OneOfField: _OneOfField, CyclicSchemaField } = fields;
  const {
    namedFieldAbove,
    namedAbove,
    framedAbove,
    schema,
    xxxOfKey,
    uiField,
    uiSchema,
    fieldUiSchema,
    ownUiOptions,
    uiOptions,
    fieldToRender,
    uiRequired,
    effectiveRequired,
    hideError,
    hidden,
    title,
    label,
    schemaDescription,
    fieldComponentId,
    plannedAsOptions,
    renderedComponent,
    presentation,
    ownErrors,
    xxxOfOptions,
    uiState,
    ownsUiState,
    keepSelection,
    editOwnProperty,
    shownOption,
    fieldShownOption,
    fieldSchema,
    disabled: plannedDisabled,
    readonly,
  } = useSchemaFieldPlan<T, S, F>(props);
  const hasOptions = xxxOfOptions !== undefined;
  // An object rendered beside the options draws its Optional Data Controls in its heading, so the option's field doesn't
  const controlsBesideAbove = use(OptionalControlsBesideContext);
  const controlsDrawnBeside =
    hasOptions &&
    fieldToRender !== undefined &&
    // Asked only of a field that isn't withheld, which `plannedAsOptions` then plans as the options for being a pure union
    drawsControlsBesideOwnOptions<T, S, F>(fieldToRender, fields, () => !plannedAsOptions) &&
    shouldRenderOptionalField<T, S, F>(registry, fieldSchema, effectiveRequired, fieldUiSchema, fieldPath);
  // Read off the schema rather than the value, so an array or object holding nothing yet is still one
  const fieldType = getSchemaType<S>(fieldSchema);
  const holdsContainer = fieldType === 'array' || fieldType === 'object';
  const handleBlur = useSendBlur(fieldPath, props.onBlur, holdsContainer ? 'leaves' : 'field');
  const handleSelectorBlur = useSendBlur(fieldPath, props.onBlur, 'nothing');
  const { required: fieldUiRequired, initialValue: fieldInitialValue, emptyValue: fieldEmptyValue } = ownUiOptions;

  const rendersNamedField = fieldToRender?.rendersNamedField === true;
  // The selected option, and whatever renders this field's data below a field that is not named here, renders as a
  // field of its own; only the named field renders inside this one's template
  const ownNamedFieldPath = useMemo<NamedFieldPath | undefined>(
    () =>
      namedAbove || rendersNamedField ? { fieldPath, framedAbove: false, optionsRendered: false } : namedFieldAbove,
    [namedAbove, rendersNamedField, fieldPath, namedFieldAbove],
  );
  const namedFieldPath = useMemo<NamedFieldPath | undefined>(
    () =>
      rendersNamedField
        ? // The options beside the named field hand its errors to the selected option, as its `rawErrors` leave them out
          { fieldPath, framedAbove: true, optionsRendered: hasOptions, errors: hasOptions ? undefined : ownErrors }
        : ownNamedFieldPath,
    [rendersNamedField, fieldPath, hasOptions, ownErrors, ownNamedFieldPath],
  );

  /** Intermediary `onChange` handler for field components that will inject the `id` of the current field into the
   * `onChange` chain if it is not already being provided from a deeper level in the hierarchy. An edit to a property
   * of the object's own that the options can disagree about, through a keyword naming it or one reading the object
   * whole, may be a choice between them, so the data it leaves is matched again. Any other edit holds the option shown,
   * as an edit inside the option does: every option says the same of the property, so the edit cannot be a choice
   * between them
   */
  const handleFieldComponentChange = useCallback(
    (newFormData: T | undefined, changedFieldPath: FieldPath, newErrorSchema?: ErrorSchema<T>, id?: string) => {
      if (hasOptions) {
        editOwnProperty(fieldPathToList(changedFieldPath)[fieldPathToList(fieldPath).length]);
      }
      onChange(newFormData, changedFieldPath, newErrorSchema, id || fieldId);
    },
    [fieldId, fieldPath, onChange, hasOptions, editOwnProperty],
  );
  const handleOptionFieldChange = useCallback(
    (newFormData: T | undefined, changedFieldPath: FieldPath, newErrorSchema?: ErrorSchema<T>, id?: string) => {
      keepSelection();
      onChange(newFormData, changedFieldPath, newErrorSchema, id);
    },
    [onChange, keepSelection],
  );

  // Outside a `Form` the outermost field's store is the one of the whole tree, so the fields below share its selections
  const withUiState = (node: ReactElement): ReactElement =>
    ownsUiState ? <UiStateContext value={uiState}>{node}</UiStateContext> : node;

  // What the field below rendering this same id inherits: the option field, the fallback UI's value field, or the field
  // a custom field wrapping `SchemaField` renders
  const handsDownOwnParts = fieldToRender?.handsDownOwnParts;
  const presentationBelow = useMemo(
    () =>
      presentation && {
        id: fieldId,
        plan: handsDownOwnParts ? getPresentationHandedDown(presentation) : presentation,
        title,
        schemaDescription,
      },
    [fieldId, presentation, handsDownOwnParts, title, schemaDescription],
  );
  const isContainer = renderedComponent === fields.ObjectField || renderedComponent === fields.ArrayField;
  // Keyed on whether the options render rather than on their array, which is retrieved afresh with every change of the
  // data, so a keystroke beside the options hands the selector the same plan
  const rendersOptions = xxxOfOptions !== undefined;
  const optionsPresentation = useMemo(
    () =>
      rendersOptions && !plannedAsOptions && presentation
        ? getOptionsPresentation(presentation, fieldId, isContainer)
        : presentation,
    [rendersOptions, plannedAsOptions, presentation, fieldId, isContainer],
  );
  // The option below a custom field inherits the plan its options are handed, which describes it by none of the ids the
  // custom field may not render; below a container it inherits the field's own, whose heading it compares its own with
  const optionsBelow = useMemo(
    () =>
      presentationBelow && optionsPresentation && !isContainer && optionsPresentation !== presentation
        ? { ...presentationBelow, plan: optionsPresentation }
        : presentationBelow,
    [presentationBelow, optionsPresentation, isContainer, presentation],
  );

  // A field a named one frames takes its own errors from the context, as its `errorSchema` is handed on without them, so
  // they are put back for the options, which hand them to the selected option
  const optionsErrorSchema = useMemo(
    () => (framedAbove && ownErrors ? { ...errorSchema, __errors: ownErrors } : errorSchema),
    [framedAbove, ownErrors, errorSchema],
  );

  const entryAbove = use(TemplateWarnEntryContext);
  // An additional property's own key, and the keys above a field nested beneath one, collapse like array indexes:
  // every extra key renders the one entry, so a mistake in it warns once rather than once per key
  const additionalDepths = useAdditionalDepths(schema, fieldPath);
  // Names the uiSchema entry rather than the field in a template-override warning, so an `items` or
  // `additionalProperties` mistake warns once, not once per row or extra key. Rendered as a shown `anyOf`/`oneOf`
  // option, the field renders at the option field's own path, so it takes the option entry's label rather than name
  // the entry above itself. Memoized, since it is provided to everything below
  const templateEntry = useMemo(
    () => ({
      fieldPath,
      label:
        entryAbove?.fieldPath === fieldPath
          ? entryAbove.label
          : () => entryLabelForLog(fieldPath, registry.globalFormOptions, additionalDepths),
    }),
    [entryAbove, fieldPath, registry.globalFormOptions, additionalDepths],
  );

  // Stop $ref cycles: `retrieveSchema()` hands out a property whose $ref leads back round a recursion with this flag,
  // which is when the field is left unresolved above. The check must come after all hook calls to satisfy React's
  // rules of hooks.
  if (!uiField || !fieldToRender) {
    return withUiState(<CyclicSchemaField {...props} />);
  }
  const { optionsGiveWayToField } = fieldToRender;
  // A pure union's object has nothing of its own beside its options, so like a withheld field it renders nothing, rather
  // than leave each theme's `ObjectFieldTemplate` to tell that an object it is handed is one and drop its empty frame
  const FieldComponent = plannedAsOptions ? RenderNothing : fieldToRender.FieldComponent;

  const { FieldTemplate, DescriptionFieldTemplate, FieldHelpTemplate, FieldErrorTemplate } = getTemplates<T, S, F>(
    registry,
    uiOptions,
    templateEntry.label,
  );

  // A field the options give way to renders the choice between them, so with no options it has nothing to choose, which
  // no `ui:disabled` can change
  const hasNoOptionToChoose = optionsGiveWayToField && xxxOfKey !== undefined && (schema[xxxOfKey]?.length ?? 0) === 0;
  const disabled = plannedDisabled || hasNoOptionToChoose;
  if (
    uiRequired === false &&
    required &&
    // Checked field-only (no globalUiOptions), matching computeDefaults()'s own resolution of these options: a
    // global ui:emptyValue/ui:initialValue wouldn't actually be applied to this field's default, so it must not
    // silence a warning about the field staying genuinely empty.
    fieldInitialValue === undefined &&
    fieldEmptyValue === undefined &&
    // schema.default (the resolved schema, after retrieveSchema()) guarantees a value just as well as ui:initialValue
    // or ui:emptyValue would, so it must also silence the warning.
    schema.default === undefined
  ) {
    logOnce(
      `ui:required turns off required for schema-required field ${fieldLabelForLog(fieldId, fieldPath)} but neither ` +
        'ui:initialValue nor ui:emptyValue is set. The UI will show this field as optional, but schema validation ' +
        'will still fail if it is left empty.',
    );
  }
  const autofocus = Boolean(ownUiOptions.autofocus ?? props.autofocus);
  if (Object.keys(schema).length === 0) {
    return null;
  }
  // Falling back to the field for the schema is kept over throwing, but a caller who asked for their own field would
  // otherwise have no sign it was dropped.
  // The message describes the fallback the field renders, which its plan labels as it labels that field anywhere else.
  // An `items` entry reaches every item of its array, so a field's own `ui:field` is named with the item's index left
  // out, and every item the entry reaches shares one warning. A tuple's per-position entries and its `additionalItems`
  // share it too, since nothing here tells them apart
  for (const message of uiField.ignored) {
    logOnce(message);
  }

  let XxxOfField: Field<T, S, F> | undefined;
  if (xxxOfOptions) {
    XxxOfField = xxxOfKey === ANY_OF_KEY ? _AnyOfField : _OneOfField;
  }

  const { __errors: _errorSchemaErrors, ...fieldErrorSchema } = errorSchema ?? {};

  const fieldComponent = (
    <FieldComponent
      {...props}
      onChange={handleFieldComponentChange}
      onBlur={handleBlur}
      id={fieldComponentId}
      schema={fieldSchema}
      uiSchema={fieldUiSchema}
      {...(fieldUiRequired !== undefined ? { required: effectiveRequired } : {})}
      disabled={disabled}
      readonly={readonly}
      hideError={hideError}
      autofocus={autofocus}
      errorSchema={fieldErrorSchema as ErrorSchema}
      // The `XxxOfField` hands the field's own errors to the selected option and its selector
      {...getFieldErrorProps<T, S, F>(XxxOfField ? undefined : ownErrors)}
      presentation={presentation}
    />
  );
  // Always wrapped, since switching between a wrapped and a bare field component remounts it and everything below it.
  // A container's properties and items render under ids of their own, so they inherit nothing from it, and are handed
  // no plan whose every change would re-render each of them past its `memo`
  const field = (
    <NamedFieldContext value={namedFieldPath}>
      <ShownOptionContext value={fieldShownOption}>
        <PresentationContext value={isContainer ? undefined : presentationBelow}>{fieldComponent}</PresentationContext>
      </ShownOptionContext>
    </NamedFieldContext>
  );

  const { description: templateDescription, help, errors: templateErrors } = getTemplateParts(presentation);
  const description = templateDescription?.text ?? '';

  // From its own errors and `ui:hideError`, as the deprecated `rawErrors` its template is handed are, rather than from
  // its plan, which beneath an `anyOf`/`oneOf` field takes the errors as the field above shows them where it does. Where
  // the option's `ui:hideError` differs from the field above's, the option's own wins here
  const hasErrors = !hideError && (ownErrors?.length ?? 0) > 0;

  const helpComponent = (
    <FieldHelpTemplate
      help={help}
      id={fieldId}
      schema={schema}
      uiSchema={uiSchema}
      hasErrors={hasErrors}
      registry={registry}
      presentation={presentation}
    />
  );
  // The field above a selected option draws its errors right after the option, so they don't vanish with no option
  const errorsComponent = templateErrors && (
    <FieldErrorTemplate
      errors={[...templateErrors]}
      errorSchema={errorSchema}
      id={fieldId}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    />
  );
  const fieldProps: Omit<FieldTemplateProps<T, S, F>, 'children'> = {
    description: templateDescription?.text ? (
      <DescriptionFieldTemplate
        id={templateDescription.id}
        description={templateDescription.text}
        hasErrors={hasErrors}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
    ) : undefined,
    rawDescription: description,
    help: helpComponent,
    rawHelp: help,
    errors: errorsComponent,
    ...getDeprecatedTemplateProps<T, S, F>(presentation, ownErrors, hideError),
    errorSchema,
    fieldPath,
    id: fieldId,
    label,
    keyName: name,
    hidden,
    onChange,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    keyNotAllowed,
    required: effectiveRequired,
    disabled,
    readonly,
    hideError,
    hasErrors,
    presentation,
    classNames: getFieldClassNames<S>(schema, hasErrors, uiOptions.classNames),
    style: uiOptions.style,
    formData,
    // The named field above frames this one as a wrapper renders `SchemaField` for its own data, and its template has
    // drawn the input and remove button of an extra key already. The label and other parts are drawn as its plan says
    schema: framedAbove ? withoutAdditionalFlag<S>(schema) : schema,
    uiSchema,
    registry,
  };

  // The named-field context is provided whether or not a field is named here, since adding or removing a provider would
  // remount everything below it
  return withUiState(
    <TemplateWarnEntryContext value={templateEntry}>
      <AdditionalPropertyDepthsContext value={additionalDepths}>
        <FieldTemplate {...fieldProps}>
          <>
            {field}
            {XxxOfField && (
              <NamedFieldContext value={ownNamedFieldPath}>
                <ShownOptionContext value={shownOption}>
                  <OptionalControlsBesideContext value={controlsDrawnBeside ? fieldPath : controlsBesideAbove}>
                    <PresentationContext value={optionsBelow}>
                      <XxxOfField
                        name={name}
                        disabled={disabled}
                        readonly={readonly}
                        hideError={hideError}
                        errorSchema={optionsErrorSchema}
                        formData={formData}
                        fieldPath={fieldPath}
                        id={fieldId}
                        onBlur={handleSelectorBlur}
                        onChange={handleOptionFieldChange}
                        onFocus={props.onFocus}
                        options={xxxOfOptions}
                        registry={registry}
                        required={effectiveRequired}
                        schema={schema}
                        uiSchema={uiSchema}
                        presentation={optionsPresentation}
                      />
                    </PresentationContext>
                  </OptionalControlsBesideContext>
                </ShownOptionContext>
              </NamedFieldContext>
            )}
          </>
        </FieldTemplate>
      </AdditionalPropertyDepthsContext>
    </TemplateWarnEntryContext>,
  );
}

/** `SchemaFieldRender` in `memo`; field identity props are primitives, so the default shallow comparison suffices.
 *
 * The cast to `typeof SchemaFieldRender` preserves the generic type signature (<T, S, F>) for consumers,
 * since React.memo's return type erases generic parameters.
 */
const SchemaField = memo(SchemaFieldRender) as typeof SchemaFieldRender;

export default SchemaField;
