import { useCallback, useMemo, memo } from 'react';
import type {
  ErrorSchema,
  Field,
  FieldPath,
  FieldProps,
  FieldTemplateProps,
  FormContextType,
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
  getSchemaType,
  getTemplate,
  getUiOptions,
  getUnionTypes,
  GUESSED_TYPE_FLAG,
  guessType,
  hasVisibleErrors,
  isConstant,
  isFormDataAvailable,
  logOnce,
  ONE_OF_KEY,
  resolveUiSchema,
  RJSF_REF_CYCLE_KEY,
  shouldRenderOptionalField,
  isObject,
  toConstant,
  toFieldPath,
  TranslatableString,
  UI_OPTIONS_KEY,
  UI_WIDGET_KEY,
} from '@rjsf/utils';

import fieldLabelForLog from '../../fieldLabelForLog.ts';

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

/** The `guessType()` results whose own field can render a select over constants of that type */
const SELECT_FIELD_TYPES = ['string', 'number', 'boolean'];

/** Reduces the `guessType()` results of a constant option list to the single `type` whose field can show all of them.
 * Mixed types can't share a typed field (e.g. NumberField coerces a string const to a number), an all-`null` list
 * would reach NullField, which renders nothing, and object or array constants would reach a field that edits their
 * contents rather than choosing between them. The select widget maps each option back to its original constant, so
 * `string` can represent any of them.
 *
 * @param types - The distinct `guessType()` results of the constants in one option list
 * @returns - The `type` to give a select over those constants
 */
function selectTypeForConstants(types: string[]): string {
  const nonNullTypes = types.filter((type) => type !== 'null');
  return nonNullTypes.length === 1 && SELECT_FIELD_TYPES.includes(nonNullTypes[0]) ? nonNullTypes[0] : 'string';
}

/** Whether any of a constant option list's labels comes from somewhere other than its values: an option's own
 * `title`, its `ui:title` in the matching `uiSchema.anyOf`/`uiSchema.oneOf` entry, or `ui:enumNames`
 *
 * @param options - The constant options of the keyword being rendered
 * @param keyword - The keyword the `options` came from
 * @param uiSchema - The resolved `uiSchema` for the field
 * @returns - True when at least one option is labelled
 */
function hasOptionLabels<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(options: S[], keyword: typeof ANY_OF_KEY | typeof ONE_OF_KEY, uiSchema: UiSchema<T, S, F>): boolean {
  const { enumNames } = getUiOptions<T, S, F>(uiSchema);
  if (enumNames && Object.keys(enumNames).length > 0) {
    return true;
  }
  const optionUiSchemas = uiSchema[keyword];
  return options.some(
    (option, index) =>
      Boolean(option.title) ||
      (Array.isArray(optionUiSchemas) && Boolean(getUiOptions<T, S, F>(optionUiSchemas[index]).title)),
  );
}

/** A `oneOf`/`anyOf` whose options are all constants renders as a select through the field for the schema's `type`.
 * JSON Schema doesn't require that `type`, and without it neither a field nor a widget can be resolved, so infer it
 * from the constant values. The options are read from the same keyword `isSelect()` and `optionsList()` read.
 *
 * @param schema - The retrieved schema for the field
 * @param uiSchema - The resolved `uiSchema` for the field, which may label the options
 * @returns - The `schema`, with an inferred `type` when it is a typeless select, along with the `widget` name to
 *        default the `uiSchema` to when the field for that type wouldn't render a select on its own
 */
function inferSelectType<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schema: S, uiSchema: UiSchema<T, S, F>): { schema: S; widget?: string } {
  const keyword = schema[ANY_OF_KEY] ? ANY_OF_KEY : ONE_OF_KEY;
  const options = schema[keyword];
  // `toConstant()` throws for an option that isn't a constant, so the options it maps are checked directly
  if (
    !Array.isArray(options) ||
    options.length === 0 ||
    !options.every((option) => isObject(option) && isConstant<S>(option as S))
  ) {
    return { schema };
  }
  const schemaType = getSchemaType<S>(schema);
  // ObjectField and ArrayField edit a value's contents rather than choosing between values, so a typed list of object
  // or array constants takes the `string` type its typeless spelling gets, the one whose field renders the select
  if (schemaType === 'object' || schemaType === 'array') {
    return { schema: { ...schema, type: 'string' } };
  }
  // BooleanField defaults to a checkbox, which ignores `enumOptions` and so drops the option labels. Defaulting the
  // widget rather than the type keeps `schema.type` truthful for custom fields, templates and widgets. A typed boolean
  // keeps its checkbox unless a label would be dropped, since a single option is how a checkbox that must be checked
  // is spelled, and unlabelled `true`/`false` options are exactly what a checkbox shows
  if (schemaType !== undefined) {
    const dropsLabels =
      schemaType === 'boolean' && options.length > 1 && hasOptionLabels<T, S, F>(options as S[], keyword, uiSchema);
    return { schema, widget: dropsLabels ? 'select' : undefined };
  }
  const type = selectTypeForConstants([...new Set(options.map((option) => guessType(toConstant<S>(option as S))))]);
  return { schema: { ...schema, type }, widget: type === 'boolean' ? 'select' : undefined };
}

/** Computes and returns which `Field` implementation to return in order to render the field represented by the
 * `schema`. The `uiOptions` are used to alter what potential `Field` implementation is actually returned. If no
 * appropriate `Field` implementation can be found then a wrapper around `UnsupportedFieldTemplate` is used.
 *
 * @param schema - The schema from which to obtain the type
 * @param uiOptions - The UI Options that may affect the component decision
 * @param registry - The registry from which fields and templates are obtained
 * @param isSelectSchema - Whether the `schema` is a `oneOf`/`anyOf` that represents a select
 * @returns - The `Field` component that renders the actual field data, and whether it is the fallback UI taking the
 *            schema over, which `SchemaFieldRender` needs in order to leave the `anyOf`/`oneOf` to it
 */
function getFieldComponent<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiOptions: UIOptionsType<T, S, F>,
  registry: Registry<T, S, F>,
  isSelectSchema: boolean,
): { FieldComponent: Field<T, S, F>; rendersFallbackUi: boolean } {
  const { field, widget } = uiOptions;
  const { fields, globalFormOptions } = registry;
  if (typeof field === 'function') {
    return { FieldComponent: field, rendersFallbackUi: false };
  }
  if (typeof field === 'string' && field in fields) {
    return { FieldComponent: fields[field], rendersFallbackUi: false };
  }

  const schemaType = getSchemaType(schema);
  const type: string = Array.isArray(schemaType) ? schemaType[0] : schemaType || '';

  const schemaId = schema.$id;

  let componentName = COMPONENT_TYPES[type];
  // A schema that allows more than one type, or whose type was guessed from the form data of an `additionalProperties`
  // entry the schema puts no constraint on, has no one field that can render every type it accepts. `FallbackField`
  // renders a selector for choosing which of them to enter, so it takes over whenever that opt-in UI is enabled.
  // Without it the first type the schema lists is the one rendered.
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
  // A schema with no type of its own still gets the selector whatever the widget is, the way an unrecognized `type`
  // already does: it lists no types for such a control to handle, so the widget renders within it for the chosen one
  const hasGuessedType = GUESSED_TYPE_FLAG in schema;
  const isNamedWidget = !widget || typeof widget === 'string';
  if (
    globalFormOptions.useFallbackUiForUnsupportedType &&
    (isNamedWidget || hasGuessedType) &&
    !isSelectSchema &&
    !schema.enum &&
    !isConstant<S>(schema) &&
    (getUnionTypes<S>(schema) || hasGuessedType)
  ) {
    componentName = 'FallbackField';
  }
  if (schemaId && schemaId in fields) {
    componentName = schemaId;
  }
  const rendersFallbackUi = componentName === 'FallbackField';

  // If the schema uses 'anyOf' or 'oneOf' and is not a pure select (all-constant options),
  // let the MultiSchemaField component handle the form display entirely.
  // ObjectField is excluded: it renders shared properties (defined at the parent schema
  // level) alongside the XxxOfField option selector.
  // All other field types — including primitives and arrays — have no shared renderable
  // properties, so the outer FieldComponent would only produce a spurious duplicate input.
  // FallbackField is excluded alongside ObjectField: it renders the option selector within its own value field, for
  // the type currently chosen, so returning nothing here would drop the type selector and the options with it.
  if ((schema.anyOf || schema.oneOf) && !isSelectSchema && componentName !== 'ObjectField' && !rendersFallbackUi) {
    return { FieldComponent: () => null, rendersFallbackUi: false };
  }

  return {
    FieldComponent: componentName in fields ? fields[componentName] : fields.FallbackField,
    rendersFallbackUi,
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
      return onChange(newFormData, changedFieldPath, newErrorSchema, theId);
    },
    [fieldId, onChange],
  );

  const resolvedUiSchema = useMemo(
    () => resolveUiSchema<T, S, F>(_schema, _uiSchema, registry),
    [_schema, _uiSchema, registry],
  );
  // A schema tagged as a `$ref` cycle returns below before either value is read, so it is left unretrieved
  const { schema, widget: inferredWidget } = useMemo(() => {
    if ((_schema as RJSFMarkedSchema)[RJSF_REF_CYCLE_KEY]) {
      return { schema: _schema, widget: undefined };
    }
    return inferSelectType<T, S, F>(schemaUtils.retrieveSchema(_schema, formData), resolvedUiSchema);
  }, [_schema, formData, resolvedUiSchema, schemaUtils]);
  // An inferred widget is only a default, so a widget the caller named through either spelling is written back
  // unchanged. `ui:widget` is always the key that carries it because `getDisplayLabel()` reads only that spelling to
  // decide a boolean keeps its label, and spreading leaves an existing key where the caller put it, so the order
  // `getUiOptions()` reduces in — and with it `ui:widget` against `ui:options.widget` — is untouched either way.
  // Kept apart from the schema above so that the resolved `uiSchema` keeps its identity as the form data changes
  const uiSchema = useMemo(() => {
    if (!inferredWidget) {
      return resolvedUiSchema;
    }
    const callerWidget = resolvedUiSchema[UI_WIDGET_KEY] ?? resolvedUiSchema[UI_OPTIONS_KEY]?.widget;
    return { ...resolvedUiSchema, [UI_WIDGET_KEY]: callerWidget ?? inferredWidget };
  }, [inferredWidget, resolvedUiSchema]);
  // See #439: consumed class names and style must not reach child components. Copied only when there is something
  // to strip. `resolveUiSchema()` guarantees `uiSchema` and its `ui:options` are objects, so `in` is safe on both
  const fieldUiSchema = useMemo<UiSchema<T, S, F>>(() => {
    const consumedUiOptions = uiSchema[UI_OPTIONS_KEY];
    const consumesStyling =
      'ui:classNames' in uiSchema ||
      'classNames' in uiSchema ||
      'ui:style' in uiSchema ||
      (consumedUiOptions !== undefined && ('classNames' in consumedUiOptions || 'style' in consumedUiOptions));
    if (!consumesStyling) {
      return uiSchema;
    }
    const strippedUiSchema: UiSchema<T, S, F> = { ...uiSchema };
    delete strippedUiSchema['ui:classNames'];
    delete strippedUiSchema.classNames;
    delete strippedUiSchema['ui:style'];
    if (consumedUiOptions) {
      const { classNames: consumedOptionClassNames, style: consumedOptionStyle, ...fieldUiOptions } = consumedUiOptions;
      strippedUiSchema[UI_OPTIONS_KEY] = fieldUiOptions;
    }
    return strippedUiSchema;
  }, [uiSchema]);

  // Stop $ref cycles: when resolveAllReferences detects a repeated property $ref it tags the schema with this flag.
  // The check must come after all hook calls to satisfy React's rules of hooks.
  if ((_schema as RJSFMarkedSchema)[RJSF_REF_CYCLE_KEY]) {
    return <CyclicSchemaField {...props} />;
  }

  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const FieldTemplate = getTemplate<'FieldTemplate', T, S, F>('FieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions,
  );
  const FieldHelpTemplate = getTemplate<'FieldHelpTemplate', T, S, F>('FieldHelpTemplate', registry, uiOptions);
  const FieldErrorTemplate = getTemplate<'FieldErrorTemplate', T, S, F>('FieldErrorTemplate', registry, uiOptions);
  // `isSelect()` resolves the schema on every call, so compute it once, and only for the `oneOf`/`anyOf` it applies to
  const isSelectSchema = (ANY_OF_KEY in schema || ONE_OF_KEY in schema) && schemaUtils.isSelect(schema);

  const { FieldComponent, rendersFallbackUi } = getFieldComponent<T, S, F>(schema, uiOptions, registry, isSelectSchema);

  const isDeprecated = Boolean(schema.deprecated);
  const deprecatedHandling = isDeprecated ? (uiOptions.deprecatedHandling ?? 'label') : undefined;

  const disabled = Boolean(uiOptions.disabled ?? props.disabled) || deprecatedHandling === 'disable';
  const readonly = Boolean(uiOptions.readonly ?? (props.readonly || props.schema.readOnly || schema.readOnly));
  // ui:required is deliberately resolved from this field's own uiSchema only (no globalUiOptions fallback): unlike
  // most ui:options, it has to be seen by getUiRequiredErrorSchema() too, which resolves a field's own uiSchema
  // uiSchema, so a form-wide default here would make the required indicator and schema validation disagree
  const {
    required: fieldUiRequired,
    initialValue: fieldInitialValue,
    emptyValue: fieldEmptyValue,
  } = getUiOptions<T, S, F>(uiSchema);
  const effectiveRequired = fieldUiRequired !== undefined ? Boolean(fieldUiRequired) : required;
  if (
    fieldUiRequired === false &&
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
      `ui:required is false for schema-required field ${fieldLabelForLog(fieldId, fieldPath)} but neither ` +
        'ui:initialValue nor ui:emptyValue is set. The UI will show this field as optional, but schema validation ' +
        'will still fail if it is left empty.',
    );
  }
  const uiSchemaHideError = uiOptions.hideError;
  // Set hideError to the value provided in the uiSchema, otherwise stick with the prop to propagate to children
  const hideError = uiSchemaHideError === undefined ? props.hideError : Boolean(uiSchemaHideError);
  const autofocus = Boolean(uiOptions.autofocus ?? props.autofocus);
  if (Object.keys(schema).length === 0) {
    return null;
  }

  let displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);

  /** If the schema `anyOf` or 'oneOf' can be rendered as a select control, don't render the selection and let
   * `StringField` component handle rendering unless there is a field override and that field replaces the any or one of
   */
  const isReplacingAnyOrOneOf = uiOptions.field && uiOptions.fieldReplacesAnyOrOneOf === true;
  let XxxOfField: Field<T, S, F> | undefined;
  let XxxOfOptions: S[] | undefined;
  // When rendering the `XxxOfField` the main component needs a different id, since the `XxxOfField` renders the
  // selected option for the same data address. The `fieldPath` stays the truthful data address either way.
  let fieldComponentId = fieldId;
  const rendersOptionSelector =
    (ANY_OF_KEY in schema || ONE_OF_KEY in schema) && !isReplacingAnyOrOneOf && !isSelectSchema;
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
  if (rendersOptionSelector && !rendersFallbackUi) {
    if (schema[ANY_OF_KEY]) {
      XxxOfField = _AnyOfField;
      XxxOfOptions = schema[ANY_OF_KEY].map((xxxOfSchema) =>
        schemaUtils.retrieveSchema(isObject(xxxOfSchema) ? (xxxOfSchema as S) : ({} as S), formData),
      );
    } else if (schema[ONE_OF_KEY]) {
      XxxOfField = _OneOfField;
      XxxOfOptions = schema[ONE_OF_KEY].map((xxxOfSchema) =>
        schemaUtils.retrieveSchema(isObject(xxxOfSchema) ? (xxxOfSchema as S) : ({} as S), formData),
      );
    }
    // The main FieldComponent gets the id a child named `XxxOf` would have, to avoid DOM id duplication with the
    // rendering of the same data address by the `XxxOfField`
    fieldComponentId = fieldPathToId(toFieldPath('XxxOf', fieldPath), globalFormOptions);
  }

  const { __errors, ...fieldErrorSchema } = errorSchema || {};

  const field = (
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
      rawErrors={__errors}
    />
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
  const classNames = ['rjsf-field', `rjsf-field-${getSchemaType(schema)}`];
  if (hasErrors) {
    classNames.push('rjsf-field-error');
  }
  if (uiOptions.classNames) {
    classNames.push(uiOptions.classNames);
  }

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
    rawHelp: typeof help === 'string' ? help : undefined,
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
    classNames: classNames.join(' ').trim(),
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
            uiSchema={uiSchema}
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
