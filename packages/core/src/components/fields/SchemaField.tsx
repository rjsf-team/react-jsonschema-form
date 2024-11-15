import { useCallback, Component } from 'react';
import {
  ADDITIONAL_PROPERTY_FLAG,
  deepEquals,
  descriptionId,
  ErrorSchema,
  FieldProps,
  FieldTemplateProps,
  FormContextType,
  getSchemaType,
  getTemplate,
  getUiOptions,
  ID_KEY,
  IdSchema,
  mergeObjects,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  UI_OPTIONS_KEY,
  UIOptionsType,
} from '@rjsf/utils';
import isObject from 'lodash/isObject';
import omit from 'lodash/omit';
import Markdown from 'markdown-to-jsx';

/** The map of component type to FieldName */
const COMPONENT_TYPES: { [key: string]: string } = {
  array: 'ArrayField',
  boolean: 'BooleanField',
  integer: 'NumberField',
  number: 'NumberField',
  object: 'ObjectField',
  string: 'StringField',
  null: 'NullField',
};

/** Computes and returns which `Field` implementation to return in order to render the field represented by the
 * `schema`. The `uiOptions` are used to alter what potential `Field` implementation is actually returned. If no
 * appropriate `Field` implementation can be found then a wrapper around `UnsupportedFieldTemplate` is used.
 *
 * @param schema - The schema from which to obtain the type
 * @param uiOptions - The UI Options that may affect the component decision
 * @param idSchema - The id that is passed to the `UnsupportedFieldTemplate`
 * @param registry - The registry from which fields and templates are obtained
 * @returns - The `Field` component that is used to render the actual field data
 */
function getFieldComponent<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  schema: S,
  uiOptions: UIOptionsType<T, S, F>,
  idSchema: IdSchema<T>,
  registry: Registry<T, S, F>
) {
  const field = uiOptions.field;
  const { fields, translateString } = registry;
  if (typeof field === 'function') {
    return field;
  }
  if (typeof field === 'string' && field in fields) {
    return fields[field];
  }

  const schemaType = getSchemaType(schema);
  const type: string = Array.isArray(schemaType) ? schemaType[0] : schemaType || '';

  const schemaId = schema.$id;

  let componentName = COMPONENT_TYPES[type];
  if (schemaId && schemaId in fields) {
    componentName = schemaId;
  }

  // If the type is not defined and the schema uses 'anyOf' or 'oneOf', don't
  // render a field and let the MultiSchemaField component handle the form display
  if (!componentName && (schema.anyOf || schema.oneOf)) {
    return () => null;
  }

  return componentName in fields
    ? fields[componentName]
    : () => {
        const UnsupportedFieldTemplate = getTemplate<'UnsupportedFieldTemplate', T, S, F>(
          'UnsupportedFieldTemplate',
          registry,
          uiOptions
        );

        return (
          <UnsupportedFieldTemplate
            schema={schema}
            idSchema={idSchema}
            reason={translateString(TranslatableString.UnknownFieldType, [String(schema.type)])}
            registry={registry}
          />
        );
      };
}

/** The `SchemaFieldRender` component is the work-horse of react-jsonschema-form, determining what kind of real field to
 * render based on the `schema`, `uiSchema` and all the other props. It also deals with rendering the `anyOf` and
 * `oneOf` fields.
 *
 * @param props - The `FieldProps` for this component
 */
function SchemaFieldRender<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldProps<T, S, F>
) {
  const {
    schema: _schema,
    idSchema: _idSchema,
    uiSchema,
    formData,
    errorSchema,
    idPrefix,
    idSeparator,
    name,
    onChange,
    onKeyChange,
    onDropPropertyClick,
    required,
    registry,
    wasPropertyKeyModified = false,
  } = props;
  const { formContext, schemaUtils, globalUiOptions } = registry;
  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const FieldTemplate = getTemplate<'FieldTemplate', T, S, F>('FieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions
  );
  const FieldHelpTemplate = getTemplate<'FieldHelpTemplate', T, S, F>('FieldHelpTemplate', registry, uiOptions);
  const FieldErrorTemplate = getTemplate<'FieldErrorTemplate', T, S, F>('FieldErrorTemplate', registry, uiOptions);
  const schema = schemaUtils.retrieveSchema(_schema, formData);
  const fieldId = _idSchema[ID_KEY];
  const idSchema = mergeObjects(
    schemaUtils.toIdSchema(schema, fieldId, formData, idPrefix, idSeparator),
    _idSchema
  ) as IdSchema<T>;

  /** Intermediary `onChange` handler for field components that will inject the `id` of the current field into the
   * `onChange` chain if it is not already being provided from a deeper level in the hierarchy
   */
  const handleFieldComponentChange = useCallback(
    (formData: T | undefined, newErrorSchema?: ErrorSchema<T>, id?: string) => {
      const theId = id || fieldId;
      return onChange(formData, newErrorSchema, theId);
    },
    [fieldId, onChange]
  );

  const FieldComponent = getFieldComponent<T, S, F>(schema, uiOptions, idSchema, registry);
  const disabled = Boolean(uiOptions.disabled ?? props.disabled);
  const readonly = Boolean(uiOptions.readonly ?? (props.readonly || props.schema.readOnly || schema.readOnly));
  const uiSchemaHideError = uiOptions.hideError;
  // Set hideError to the value provided in the uiSchema, otherwise stick with the prop to propagate to children
  const hideError = uiSchemaHideError === undefined ? props.hideError : Boolean(uiSchemaHideError);
  const autofocus = Boolean(uiOptions.autofocus ?? props.autofocus);
  if (Object.keys(schema).length === 0) {
    return null;
  }

  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);

  const { __errors, ...fieldErrorSchema } = errorSchema || {};
  // See #439: uiSchema: Don't pass consumed class names or style to child components
  const fieldUiSchema = omit(uiSchema, ['ui:classNames', 'classNames', 'ui:style']);
  if (UI_OPTIONS_KEY in fieldUiSchema) {
    fieldUiSchema[UI_OPTIONS_KEY] = omit(fieldUiSchema[UI_OPTIONS_KEY], ['classNames', 'style']);
  }

  const field = (
    <FieldComponent
      {...props}
      onChange={handleFieldComponentChange}
      idSchema={idSchema}
      schema={schema}
      uiSchema={fieldUiSchema}
      disabled={disabled}
      readonly={readonly}
      hideError={hideError}
      autofocus={autofocus}
      errorSchema={fieldErrorSchema}
      formContext={formContext}
      rawErrors={__errors}
    />
  );

  const id = idSchema[ID_KEY];

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

  const description = uiOptions.description || props.schema.description || schema.description || '';

  const richDescription = uiOptions.enableMarkdownInDescription ? (
    <Markdown options={{ disableParsingRawHTML: true }}>{description}</Markdown>
  ) : (
    description
  );
  const help = uiOptions.help;
  const hidden = uiOptions.widget === 'hidden';

  const classNames = ['form-group', 'field', `field-${getSchemaType(schema)}`];
  if (!hideError && __errors && __errors.length > 0) {
    classNames.push('field-error has-error has-danger');
  }
  if (uiSchema?.classNames) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        "'uiSchema.classNames' is deprecated and may be removed in a major release; Use 'ui:classNames' instead."
      );
    }
    classNames.push(uiSchema.classNames);
  }
  if (uiOptions.classNames) {
    classNames.push(uiOptions.classNames);
  }

  const helpComponent = (
    <FieldHelpTemplate
      help={help}
      idSchema={idSchema}
      schema={schema}
      uiSchema={uiSchema}
      hasErrors={!hideError && __errors && __errors.length > 0}
      registry={registry}
    />
  );
  /*
   * AnyOf/OneOf errors handled by child schema
   * unless it can be rendered as select control
   */
  const errorsComponent =
    hideError || ((schema.anyOf || schema.oneOf) && !schemaUtils.isSelect(schema)) ? undefined : (
      <FieldErrorTemplate
        errors={__errors}
        errorSchema={errorSchema}
        idSchema={idSchema}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
    );
  const fieldProps: Omit<FieldTemplateProps<T, S, F>, 'children'> = {
    description: (
      <DescriptionFieldTemplate
        id={descriptionId<T>(id)}
        description={richDescription}
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
    id,
    label,
    hidden,
    onChange,
    onKeyChange,
    onDropPropertyClick,
    required,
    disabled,
    readonly,
    hideError,
    displayLabel,
    classNames: classNames.join(' ').trim(),
    style: uiOptions.style,
    formContext,
    formData,
    schema,
    uiSchema,
    registry,
  };

  const _AnyOfField = registry.fields.AnyOfField;
  const _OneOfField = registry.fields.OneOfField;
  const isReplacingAnyOrOneOf = uiSchema?.['ui:field'] && uiSchema?.['ui:fieldReplacesAnyOrOneOf'] === true;

  return (
    <FieldTemplate {...fieldProps}>
      <>
        {field}
        {/*
        If the schema `anyOf` or 'oneOf' can be rendered as a select control, don't
        render the selection and let `StringField` component handle
        rendering
      */}
        {schema.anyOf && !isReplacingAnyOrOneOf && !schemaUtils.isSelect(schema) && (
          <_AnyOfField
            name={name}
            disabled={disabled}
            readonly={readonly}
            hideError={hideError}
            errorSchema={errorSchema}
            formData={formData}
            formContext={formContext}
            idPrefix={idPrefix}
            idSchema={idSchema}
            idSeparator={idSeparator}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onFocus={props.onFocus}
            options={schema.anyOf.map((_schema) =>
              schemaUtils.retrieveSchema(isObject(_schema) ? (_schema as S) : ({} as S), formData)
            )}
            registry={registry}
            required={required}
            schema={schema}
            uiSchema={uiSchema}
          />
        )}
        {schema.oneOf && !isReplacingAnyOrOneOf && !schemaUtils.isSelect(schema) && (
          <_OneOfField
            name={name}
            disabled={disabled}
            readonly={readonly}
            hideError={hideError}
            errorSchema={errorSchema}
            formData={formData}
            formContext={formContext}
            idPrefix={idPrefix}
            idSchema={idSchema}
            idSeparator={idSeparator}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onFocus={props.onFocus}
            options={schema.oneOf.map((_schema) =>
              schemaUtils.retrieveSchema(isObject(_schema) ? (_schema as S) : ({} as S), formData)
            )}
            registry={registry}
            required={required}
            schema={schema}
            uiSchema={uiSchema}
          />
        )}
      </>
    </FieldTemplate>
  );
}

/** The `SchemaField` component determines whether it is necessary to rerender the component based on any props changes
 * and if so, calls the `SchemaFieldRender` component with the props.
 */
class SchemaField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> extends Component<
  FieldProps<T, S, F>
> {
  shouldComponentUpdate(nextProps: Readonly<FieldProps<T, S, F>>) {
    return !deepEquals(this.props, nextProps);
  }

  render() {
    return <SchemaFieldRender<T, S, F> {...this.props} />;
  }
}

export default SchemaField;
