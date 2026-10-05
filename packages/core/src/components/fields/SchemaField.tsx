import { useCallback, useMemo, memo } from 'react';
import type {
  ErrorSchema,
  Field,
  FieldPath,
  FieldProps,
  FieldTemplateProps,
  FormContextType,
  ONE_OF_KEY,
  Registry,
  RJSFMarkedSchema,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
  UiSchema,
} from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  ANY_OF_KEY,
  descriptionId,
  fieldPathToId,
  getByPath,
  getDeprecatedHandling,
  getFieldClassNames,
  getSchemaOwnTypes,
  getSchemaType,
  getTemplates,
  getUiOptions,
  getUnionTypes,
  getWidgetType,
  getXxxOfKey,
  GUESSED_TYPE_FLAG,
  guessType,
  hasVisibleErrors,
  isComponentType,
  isConstant,
  isConstantOptionList,
  isConstantSelect,
  isFormDataAvailable,
  logOnce,
  omitConsumedStyling,
  resolveUiSchema,
  RJSF_REF_CYCLE_KEY,
  shouldRenderOptionalField,
  isObject,
  toConstant,
  toFieldPath,
  TranslatableString,
  UI_FIELD_KEY,
  UI_OPTIONS_KEY,
  UI_WIDGET_KEY,
  uiBooleanOption,
} from '@rjsf/utils';

import describeUnresolvedComponent from '../../describeUnresolvedComponent.ts';
import fieldLabelForLog, { entryLabelForLog } from '../../fieldLabelForLog.ts';
import hasOptionLabels from '../../hasOptionLabels.ts';
import WithheldErrorsContext from './WithheldErrorsContext.ts';

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

/** Reduces the `guessType()` results of a constant option list to the single `type` that describes all of them.
 * Mixed types can't share a typed field (e.g. NumberField coerces a string const to a number), and an all-`null` list
 * would reach NullField, which renders nothing. The select widget maps each option back to its original constant, so
 * `string` can represent any of them.
 *
 * @param types - The distinct `guessType()` results of the constants in one option list
 * @returns - The `type` to give a select over those constants
 */
function selectTypeForConstants(types: string[]): string {
  const nonNullTypes = types.filter((type) => type !== 'null');
  return nonNullTypes.length === 1 ? nonNullTypes[0] : 'string';
}

/** The types whose field renders through `StringField`, which falls back to the widget a `format` names */
const FORMAT_FIELD_TYPES = ['string', 'number', 'integer'];

/** Picks the field type for a `type` list whose resolved type has no widget by the name the field renders with, when
 * another type the list names does: a `textarea` on a `['null', 'number', 'string']` is rendered by `StringField`, an
 * `updown` on a `['string', 'number']` by `NumberField`, and a `checkbox` on a `['number', 'boolean']` by
 * `BooleanField`. The resolved type's field would otherwise cast what the widget emits to its own type, saving the
 * `'007'` typed into a `textarea` as `7`. A list resolving to `object` or `array` keeps its own field, as
 * `getWidgetType()` decides.
 *
 * @param schema - The schema being rendered
 * @param type - The type `getSchemaType()` resolves the schema to
 * @param widget - The `ui:widget` for the field, if any
 * @param isUnion - Whether `getUnionTypes()` finds several non-null types in the schema's `type` list
 * @returns - The type whose field renders the widget, otherwise `type`
 */
function typeForWidget<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schema: S,
  type: string,
  widget: UIOptionsType<T, S, F>['widget'],
  isUnion: boolean,
): string {
  if (!isUnion) {
    return type;
  }
  const widgetName = widget ?? (FORMAT_FIELD_TYPES.includes(type) ? schema.format : undefined);
  return (typeof widgetName === 'string' ? getWidgetType<S>(schema, widgetName) : undefined) ?? type;
}

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
    schema = { ...retrievedSchema, type: selectTypeForConstants(types) };
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
        (Array.isArray(schema.type) && selectTypeForConstants(schema.type) !== 'boolean')));
  return needsSelect ? 'select' : undefined;
}

/** Looks up what a `ui:field` refers to: the value registered under it when it is a name, otherwise the `ui:field`
 * itself. `getByPath()` reads own properties only, so a name such as `constructor` or `toString` resolves to nothing
 * rather than to something off `Object.prototype`, which rendered as a component threw "Objects are not valid as a
 * React child"
 *
 * @param field - The `field` from the UI options
 * @param fields - The registered fields
 * @returns - The value the `ui:field` refers to, which is not necessarily a component
 */
function lookUpUiField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(field: UIOptionsType<T, S, F>['field'], fields: Registry<T, S, F>['fields']): unknown {
  return typeof field === 'string' ? getByPath(fields, field) : field;
}

/** The field a `ui:field` names, and what was ignored on the way to it */
interface UiFieldResolution<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The field `getFieldComponent()` renders in place of the one for the schema's type, if a `ui:field` names one */
  namedField?: Field<T, S, F>;
  /** What the field's own `ui:field` was, when it was given but names no field, for the warning that it was ignored */
  ignoredOwnField?: string;
  /** What `ui:globalOptions.field` was, when it applied to the field but names no field, for the same warning */
  ignoredGlobalField?: string;
}

/** Resolves the field a `ui:field` names, given as a component or as the name of a registered field. A component is
 * either a function or one of the objects `memo()`, `forwardRef()` and `lazy()` return, all of which `Field`'s type
 * admits, and a registered value is checked the same way as one given directly, since `fields` can hold anything a
 * caller passes in.
 *
 * A field's own `ui:field` that names nothing is ignored, so the `ui:globalOptions.field` it would have shadowed applies
 * as though it were never given. An empty one — `undefined`, `null`, `false`, `''` or `0` — still shadows it, since it
 * asks for no field: `undefined` is how `SchemaField` shadows it for a schema's options, and a JSON uiSchema, which can't
 * spell `undefined`, clears it for one field with `null` or `false`. An empty `ui:globalOptions.field` asks for no field
 * the same way, so it isn't warned about either.
 *
 * @param ownUiOptions - The field's own UI options, without the global ones
 * @param globalField - The `field` from `ui:globalOptions`
 * @param fields - The registered fields
 * @returns - The field to render, if any, and a description of each `ui:field` that was ignored
 */
function resolveUiField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  ownUiOptions: UIOptionsType<T, S, F>,
  globalField: UIOptionsType<T, S, F>['field'],
  fields: Registry<T, S, F>['fields'],
): UiFieldResolution<T, S, F> {
  const ownField = ownUiOptions.field;
  const ownResolved = lookUpUiField<T, S, F>(ownField, fields);
  if (isComponentType<FieldProps<T, S, F>>(ownResolved)) {
    return { namedField: ownResolved };
  }
  if (!ownField && Object.hasOwn(ownUiOptions, 'field')) {
    return {};
  }
  const ignoredOwnField = ownField
    ? describeUnresolvedComponent(ownField, ownResolved, 'registered field', 'MyField')
    : undefined;
  const globalResolved = lookUpUiField<T, S, F>(globalField, fields);
  if (isComponentType<FieldProps<T, S, F>>(globalResolved)) {
    return { namedField: globalResolved, ignoredOwnField };
  }
  return {
    ignoredOwnField,
    ignoredGlobalField: globalField
      ? describeUnresolvedComponent(globalField, globalResolved, 'registered field', 'MyField')
      : undefined,
  };
}

const RenderNothing = () => null;

/** Computes and returns which `Field` implementation to return in order to render the field represented by the
 * `schema`. The `uiOptions` are used to alter what potential `Field` implementation is actually returned. If no
 * appropriate `Field` implementation can be found then a wrapper around `UnsupportedFieldTemplate` is used.
 *
 * @param schema - The schema from which to obtain the type
 * @param uiOptions - The UI Options that may affect the component decision
 * @param namedField - The field the `ui:field` resolved to through `resolveUiField()`, if it resolved to one
 * @param registry - The registry from which fields and templates are obtained
 * @param xxxOfKey - The keyword the `schema`'s options are read from, if it has any
 * @param isSelectSchema - Whether the `schema` is an `enum` or a `oneOf`/`anyOf` that represents a select
 * @param hasConstantOptions - Whether that select offers at least one option, see `isConstantSelect()`
 * @returns - The `Field` component that renders the actual field data, whether that component renders the `schema`'s
 *            `anyOf`/`oneOf` options itself, and whether the `schema` has options for `SchemaFieldRender` to render an
 *            option selector of. Both flags are decided here so that this function and `SchemaFieldRender` read the
 *            same answers, and `SchemaFieldRender` reads them together: when the fallback UI has the schema it renders
 *            those options itself, within the value field for the type it has pinned, so the selector it would render
 *            is left unrendered even though the schema calls for one
 */
function getFieldComponent<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiOptions: UIOptionsType<T, S, F>,
  namedField: Field<T, S, F> | undefined,
  registry: Registry<T, S, F>,
  xxxOfKey: typeof ANY_OF_KEY | typeof ONE_OF_KEY | undefined,
  isSelectSchema: boolean,
  hasConstantOptions: boolean,
): {
  FieldComponent: Field<T, S, F>;
  rendersOptionsItself: boolean;
  rendersOptionSelector: boolean;
  optionsReplaceNamedField: boolean;
} {
  const { widget } = uiOptions;
  const { fields, globalFormOptions } = registry;

  const isUnion = getUnionTypes<S>(schema) !== undefined;
  let type = getSchemaType(schema) ?? '';
  // A select's options pin its value, so a select whose declared type list names several non-null types is rendered
  // by StringField, which keeps each option's value as it is, and one naming a single non-null type by that type's
  // field. The first listed type's field would leave `null` blank, or cast every other option's value to its own type
  // the way NumberField turns `true` into `1`
  if (isSelectSchema && Array.isArray(schema.type)) {
    type = selectTypeForConstants(schema.type);
  } else {
    type = typeForWidget<T, S, F>(schema, type, widget, isUnion);
  }

  const schemaId = schema.$id;

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
  // Without it the type `getSchemaType()` resolves the list to is the one rendered, unless `typeForWidget()` picks
  // another listed type for the widget.
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
    (isUnion || hasGuessedType);
  if (isDivertedToFallbackUi) {
    componentName = 'FallbackField';
  }
  if (schemaId && Object.hasOwn(fields, schemaId)) {
    componentName = schemaId;
  }

  /** The one component every answer below is derived from, so that none of them can describe another: the field a
   * `ui:field` resolved to, or the field the type and the `$id` settled on a name for, or the fallback UI for a name
   * no field is registered under — an unrecognized `type`, or no type at all
   */
  const FieldComponent =
    namedField ?? (Object.hasOwn(fields, componentName) ? fields[componentName] : fields.FallbackField);
  /** Whether the component is this very field, whatever named it — the type having no field of its own, the opt-in
   * diverting a union, a `ui:field` or a `$id`. What it renders depends on the opt-in; that it is not a field written
   * for the schema does not
   */
  const isFallbackField = FieldComponent === fields.FallbackField;
  /** `FallbackField` is the fallback UI only with the opt-in on; without it the component renders the unsupported field
   * template, which takes no `anyOf`/`oneOf` over
   */
  const rendersFallbackUi = isFallbackField && Boolean(globalFormOptions.useFallbackUiForUnsupportedType);
  /** A `ui:field` that resolves is the field `ui:fieldReplacesAnyOrOneOf` asks the options to give way to, whether it is
   * the field's own or the `ui:globalOptions.field` that an own one naming no field falls back to. When none resolves
   * there is nothing to give way to and the options are rendered, which is what lets the form be completed: without
   * them an object union loses the `properties` of every option.
   * One naming this field is not a field the options can give way to either: with the opt-in on what it would add is a
   * type selector, which is the choice the options already offer, and without it an unsupported-field box in their
   * place. Read from the component, so the `ui:field` spelling answers as the `$id` one does
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
   * schema names is read from the schema rather than from how the fallback UI was reached, so that a `ui:field` or a
   * `$id` naming it gets the same answer as the schema's own type having no field of its own
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
  // A field a `ui:field` resolved to is excluded too: a field written for this schema renders beside the options, which
  // is the asymmetry #5391 is about. This field is not, whether it was named by `ui:field`, by a `$id` or by the
  // schema's own type having no field, since what it would add is the type selector the options replace.
  // A schema that lists its types keeps that selector even though a typed option overrides it there too, which is the
  // asymmetry #5390 is about
  const yieldsToOptions =
    rendersOptionSelector && !rendersOptionsItself && (namedField === undefined || isFallbackField);
  /** Whether the options are rendered in place of the field a `ui:field` named. That `ui:field` has been declined for
   * this schema, so `SchemaFieldRender` keeps it from reaching the options, which would otherwise inherit it and each
   * render the field this one did not
   */
  const optionsReplaceNamedField = yieldsToOptions && namedField === fields.FallbackField;

  return {
    FieldComponent: yieldsToOptions && FieldComponent !== fields.ObjectField ? RenderNothing : FieldComponent,
    // `yieldsToOptions` requires `!rendersOptionsItself`, so the flags read the same whether or not the field is withheld
    rendersOptionsItself,
    rendersOptionSelector,
    optionsReplaceNamedField,
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
    uiSchema: _uiSchema,
    formData,
    errorSchema,
    name,
    onChange,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    required = false,
    registry,
    wasPropertyKeyModified = false,
  } = props;
  const { schemaUtils, globalFormOptions, globalUiOptions, fields } = registry;
  const { AnyOfField: _AnyOfField, OneOfField: _OneOfField, CyclicSchemaField } = fields;

  /** Intermediary `onChange` handler for field components that will inject the `id` of the current field into the
   * `onChange` chain if it is not already being provided from a deeper level in the hierarchy
   */
  const handleFieldComponentChange = useCallback(
    (newFormData: T | undefined, changedFieldPath: FieldPath, newErrorSchema?: ErrorSchema<T>, id?: string) => {
      const theId = id || fieldId;
      onChange(newFormData, changedFieldPath, newErrorSchema, theId);
    },
    [fieldId, onChange],
  );

  const resolvedUiSchema = useMemo(
    () => resolveUiSchema<T, S, F>(_schema, _uiSchema, registry),
    [_schema, _uiSchema, registry],
  );
  // A schema tagged as a `$ref` cycle returns below before either value is read, so it is left unretrieved. Retrieving
  // is kept apart from inferring the select type so that a `uiSchema` rebuilt on every render doesn't retrieve again
  const isRefCycle = Boolean((_schema as RJSFMarkedSchema)[RJSF_REF_CYCLE_KEY]);
  const retrievedSchema = useMemo(
    () => (isRefCycle ? _schema : schemaUtils.retrieveSchema(_schema, formData)),
    [isRefCycle, _schema, formData, schemaUtils],
  );
  // Kept apart from the widget below, which alone reads the `uiSchema`, so a `uiSchema` rebuilt on every render doesn't
  // hand a typeless select a new `schema` each time
  const selectSchemaInfo = useMemo(() => getSelectSchemaInfo<S>(retrievedSchema), [retrievedSchema]);
  const { schema, xxxOfKey, isSelectSchema, hasConstantOptions } = selectSchemaInfo;
  const inferredWidget = useMemo(
    () => inferSelectWidget<T, S, F>(selectSchemaInfo, resolvedUiSchema),
    [selectSchemaInfo, resolvedUiSchema],
  );
  // An inferred widget is only a default, so a widget the caller named through either spelling is written back
  // unchanged. `ui:widget` is the key that carries it because that is where the inferred default has to land, and
  // spreading leaves an existing key where the caller put it, so the order `getUiOptions()` reduces in — and with it
  // `ui:widget` against `ui:options.widget` — is untouched either way.
  // Kept apart from the schema above so that the resolved `uiSchema` keeps its identity as the form data changes
  const uiSchema = useMemo(() => {
    if (!inferredWidget) {
      return resolvedUiSchema;
    }
    const uiField = lookUpUiField<T, S, F>(resolvedUiSchema[UI_FIELD_KEY], fields);
    // `BooleanField` is the only field the widget is ever inferred for, and the only one that reads it, so another
    // field named through `ui:field` is handed the caller's `uiSchema` without a widget it never chose — which a field
    // following `BooleanField`'s lead would otherwise render in place of its own default. A field named through
    // `ui:options.field` or `ui:globalOptions.field` still gets the widget, so one that wraps `BooleanField` keeps its
    // select, as does whichever field renders in place of a `ui:field` that names nothing, as though none were given
    if (isComponentType(uiField) && uiField !== fields.BooleanField) {
      return resolvedUiSchema;
    }
    const callerWidget = resolvedUiSchema[UI_WIDGET_KEY] ?? resolvedUiSchema[UI_OPTIONS_KEY]?.widget;
    return { ...resolvedUiSchema, [UI_WIDGET_KEY]: callerWidget ?? inferredWidget };
  }, [inferredWidget, resolvedUiSchema, fields]);
  // Memoized so a child reading it past a `memo` boundary isn't re-rendered by a new object each render
  const fieldUiSchema = useMemo<UiSchema<T, S, F>>(() => omitConsumedStyling<T, S, F>(uiSchema), [uiSchema]);
  // The `uiSchema` the `anyOf`/`oneOf` options are rendered against when they are rendered in place of the field a
  // `ui:field` named, see `optionsReplaceNamedField`. Memoized alongside the `uiSchema` it shadows the `field` of, since
  // `MultiSchemaField` derives its per-option `uiSchema` array from this one and hands that array to a `useCallback`:
  // a new object per render would rebuild both and re-render the option selector on every keystroke
  const uiSchemaWithoutNamedField = useMemo<UiSchema<T, S, F>>(() => {
    // Nothing names a field in any of the three spellings, so there is nothing to shadow: the caller's own `uiSchema` is
    // what the options render against, and every field in a form that names none keeps the identity it already had
    if (
      uiSchema[UI_FIELD_KEY] === undefined &&
      uiSchema[UI_OPTIONS_KEY]?.field === undefined &&
      globalUiOptions?.field === undefined
    ) {
      return uiSchema;
    }
    const shadowedUiSchema: UiSchema<T, S, F> = {
      ...uiSchema,
      [UI_OPTIONS_KEY]: { ...uiSchema[UI_OPTIONS_KEY], field: undefined },
    };
    delete shadowedUiSchema[UI_FIELD_KEY];
    return shadowedUiSchema;
  }, [uiSchema, globalUiOptions]);
  const ownErrors = errorSchema?.__errors;
  // Memoized so that an `ArrayField` below, which reads it, isn't re-rendered past its `memo` by a new value each render
  const withheldErrors = useMemo(
    () => (ownErrors?.length ? { fieldPath, errors: ownErrors } : undefined),
    [fieldPath, ownErrors],
  );

  // Stop $ref cycles: when resolveAllReferences detects a repeated property $ref it tags the schema with this flag.
  // The check must come after all hook calls to satisfy React's rules of hooks.
  if ((_schema as RJSFMarkedSchema)[RJSF_REF_CYCLE_KEY]) {
    return <CyclicSchemaField {...props} />;
  }

  const ownUiOptions = getUiOptions<T, S, F>(uiSchema);
  // What `getUiOptions(uiSchema, globalUiOptions)` returns, without reading the `uiSchema`'s keys a second time
  const uiOptions: UIOptionsType<T, S, F> = { ...globalUiOptions, ...ownUiOptions };
  const { FieldTemplate, DescriptionFieldTemplate, FieldHelpTemplate, FieldErrorTemplate } = getTemplates<T, S, F>(
    registry,
    uiOptions,
  );

  const { namedField, ignoredOwnField, ignoredGlobalField } = resolveUiField<T, S, F>(
    ownUiOptions,
    globalUiOptions?.field,
    fields,
  );
  const { FieldComponent, rendersOptionsItself, rendersOptionSelector, optionsReplaceNamedField } = getFieldComponent<
    T,
    S,
    F
  >(schema, uiOptions, namedField, registry, xxxOfKey, isSelectSchema, hasConstantOptions);

  const deprecatedHandling = getDeprecatedHandling<T, S, F>(schema, uiOptions);

  const disabled = Boolean(uiOptions.disabled ?? props.disabled) || deprecatedHandling === 'disable';
  const readonly = Boolean(uiOptions.readonly ?? (props.readonly || props.schema.readOnly || schema.readOnly));
  // ui:required is deliberately resolved from this field's own uiSchema only (no globalUiOptions fallback): unlike
  // most ui:options, it has to be seen by getUiRequiredErrorSchema() too, which resolves a field's own uiSchema
  // uiSchema, so a form-wide default here would make the required indicator and schema validation disagree
  const { required: fieldUiRequired, initialValue: fieldInitialValue, emptyValue: fieldEmptyValue } = ownUiOptions;
  const uiRequired = uiBooleanOption(fieldUiRequired);
  const effectiveRequired = uiRequired ?? required;
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
  // Set hideError to the value provided in the uiSchema, otherwise stick with the prop to propagate to children
  const hideError = uiBooleanOption(uiOptions.hideError) ?? props.hideError;
  const autofocus = Boolean(uiOptions.autofocus ?? props.autofocus);
  if (Object.keys(schema).length === 0) {
    return null;
  }
  // Falling back to the field for the schema is kept over throwing, but a caller who asked for their own field would
  // otherwise have no sign it was dropped.
  // The message describes the intended fallback. Until #5389 is fixed, `getDisplayLabel()` still hides the label for
  // any top-level `ui:field` that is set, resolved or not, so that field's label is missing; that is #5389's to fix,
  // not this message's.
  // A `ui:globalOptions.field` reaches every field that sets none of its own, each with its own label, so it is warned
  // about once for the form rather than once per field. An `items` entry reaches every item of its array the same way,
  // so a field's own `ui:field` is named with the item's index left out, and every item the entry reaches shares one
  // warning. A tuple's per-position entries and its `additionalItems` share it too, since nothing here tells them apart
  if (ignoredOwnField) {
    logOnce(
      `ui:field for ${entryLabelForLog(fieldPath, globalFormOptions)} ${ignoredOwnField}, so it is ignored and the ` +
        'field is rendered as though no ui:field were given.',
    );
  }
  if (ignoredGlobalField) {
    logOnce(
      `ui:globalOptions.field ${ignoredGlobalField}, so it is ignored and the fields it applies to are rendered as ` +
        'though no ui:field were given.',
    );
  }

  let displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);

  let XxxOfField: Field<T, S, F> | undefined;
  let XxxOfOptions: S[] | undefined;
  // An option that declares no `uiSchema` of its own is rendered against this one, so a `ui:field` the options are
  // rendered in place of would reach every option and have each render the field this schema declined. Shadowed rather
  // than deleted, for the reason `FallbackField` shadows the same key: `getUiOptions()` layers a
  // `ui:globalOptions.field` under the local entry, so deleting the local one leaves the global showing through
  const XxxOfUiSchema: UiSchema<T, S, F> = optionsReplaceNamedField ? uiSchemaWithoutNamedField : uiSchema;
  // When rendering the `XxxOfField` the main component needs a different id, since the `XxxOfField` renders the
  // selected option for the same data address. The `fieldPath` stays the truthful data address either way.
  let fieldComponentId = fieldId;
  // When the option selector is an optional data control AND it does not have form data, hide the label: it names a
  // control that is not on screen yet. This is decided here rather than with the `XxxOfField` below because the
  // fallback UI renders that same selector for the type it has pinned, and the value field it renders it within is
  // already labelled `false`, which leaves this the only field either label can come from
  if (rendersOptionSelector) {
    const isOptionalRender = shouldRenderOptionalField<T, S, F>(registry, schema, effectiveRequired, uiSchema);
    displayLabel = displayLabel && (!isOptionalRender || isFormDataAvailable<T>(formData));
  }
  // The fallback UI renders the options itself, against the schema with its type pinned to the one its selector is on,
  // so rendering them here as well would show the same option selector twice — once for the union and once for the
  // type in effect — and only the inner one would follow the type the user chose
  // `xxxOfKey` is what `rendersOptionSelector` was decided from, so it is set whenever that is, which the narrowing
  // here restates for the lookup below
  if (rendersOptionSelector && xxxOfKey !== undefined && !rendersOptionsItself) {
    XxxOfField = xxxOfKey === ANY_OF_KEY ? _AnyOfField : _OneOfField;
    XxxOfOptions = schema[xxxOfKey]!.map((xxxOfSchema) =>
      schemaUtils.retrieveSchema(isObject(xxxOfSchema) ? (xxxOfSchema as S) : ({} as S), formData),
    );
    // The main FieldComponent gets the id a child named `XxxOf` would have, to avoid DOM id duplication with the
    // rendering of the same data address by the `XxxOfField`
    fieldComponentId = fieldPathToId(toFieldPath('XxxOf', fieldPath), globalFormOptions);
  }

  const { __errors, ...fieldErrorSchema } = errorSchema ?? {};

  const fieldComponent = (
    <FieldComponent
      {...props}
      onChange={handleFieldComponentChange}
      id={fieldComponentId}
      schema={schema}
      uiSchema={fieldUiSchema}
      {...(fieldUiRequired !== undefined ? { required: effectiveRequired } : {})}
      disabled={disabled}
      readonly={readonly}
      hideError={hideError}
      autofocus={autofocus}
      errorSchema={fieldErrorSchema as ErrorSchema}
      // The `XxxOfField` renders the field's own errors whenever it renders, which is also why `FieldErrorTemplate`
      // is skipped then
      rawErrors={XxxOfField ? undefined : __errors}
    />
  );
  // Always wrapped, since switching between a wrapped and a bare field component remounts it and everything below it
  const field = (
    <WithheldErrorsContext value={XxxOfField ? withheldErrors : undefined}>{fieldComponent}</WithheldErrorsContext>
  );

  // If this schema has a title defined, but the user has set a new key/label, retain their input.
  let label;
  if (wasPropertyKeyModified) {
    label = name;
  } else {
    label =
      ADDITIONAL_PROPERTY_FLAG in schema
        ? name
        : uiOptions.title || props.schema.title || schema.title || props.title || name;
  }

  if (deprecatedHandling === 'label') {
    label = registry.translateString(TranslatableString.DeprecatedLabel, [label]);
  }

  const description = uiOptions.description || props.schema.description || schema.description || '';
  const { help } = uiOptions;
  const hidden = uiOptions.widget === 'hidden' || deprecatedHandling === 'hide';

  const hasErrors = hasVisibleErrors({ rawErrors: __errors, hideError });

  const helpComponent = (
    <FieldHelpTemplate
      help={help}
      id={fieldId}
      schema={schema}
      uiSchema={uiSchema}
      hasErrors={hasErrors}
      registry={registry}
    />
  );
  // AnyOf/OneOf errors are handled by the child schema, so they are skipped whenever one is rendering. A select is
  // already excluded because it is what stops `XxxOfField` from being assigned in the first place
  const errorsComponent =
    hideError || XxxOfField ? undefined : (
      <FieldErrorTemplate
        errors={__errors}
        errorSchema={errorSchema}
        id={fieldId}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
    );
  const fieldProps: Omit<FieldTemplateProps<T, S, F>, 'children'> = {
    description: (
      <DescriptionFieldTemplate
        id={descriptionId(fieldId)}
        description={description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
    ),
    rawDescription: description,
    help: helpComponent,
    rawHelp: help,
    errors: errorsComponent,
    rawErrors: hideError ? undefined : __errors,
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
    required: effectiveRequired,
    disabled,
    readonly,
    hideError,
    displayLabel,
    classNames: getFieldClassNames<S>(schema, hasErrors, uiOptions.classNames),
    style: uiOptions.style,
    formData,
    schema,
    uiSchema,
    registry,
  };

  return (
    <FieldTemplate {...fieldProps}>
      <>
        {field}
        {XxxOfField && (
          <XxxOfField
            name={name}
            disabled={disabled}
            readonly={readonly}
            hideError={hideError}
            errorSchema={errorSchema}
            formData={formData}
            fieldPath={fieldPath}
            id={fieldId}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onFocus={props.onFocus}
            options={XxxOfOptions}
            registry={registry}
            required={effectiveRequired}
            schema={schema}
            uiSchema={XxxOfUiSchema}
          />
        )}
      </>
    </FieldTemplate>
  );
}

/** `SchemaFieldRender` in `memo`; field identity props are primitives, so the default shallow comparison suffices.
 *
 * The cast to `typeof SchemaFieldRender` preserves the generic type signature (<T, S, F>) for consumers,
 * since React.memo's return type erases generic parameters.
 */
const SchemaField = memo(SchemaFieldRender) as typeof SchemaFieldRender;

export default SchemaField;
