import React from "react";
import {
  mergeObjects,
  deepEquals,
  getUiOptions,
  getSchemaType,
  getTemplate,
  FieldProps,
  FieldTemplateProps,
  IdSchema,
  Registry,
  RJSFSchema,
  RJSFSchemaDefinition,
  UIOptionsType,
  ID_KEY,
} from "@rjsf/utils";
import isObject from "lodash/isObject";
import omit from "lodash/omit";

/** The map of component type to FieldName */
const COMPONENT_TYPES: { [key: string]: string } = {
  array: "ArrayField",
  boolean: "BooleanField",
  integer: "NumberField",
  number: "NumberField",
  object: "ObjectField",
  string: "StringField",
  null: "NullField",
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
function getFieldComponent<T, F>(
  schema: RJSFSchema,
  uiOptions: UIOptionsType<T, F>,
  idSchema: IdSchema<T>,
  registry: Registry<T, F>
) {
  const field = uiOptions.field;
  const { fields } = registry;
  if (typeof field === "function") {
    return field;
  }
  if (typeof field === "string" && field in fields) {
    return fields[field];
  }

  const schemaType = getSchemaType(schema);
  const type: string = Array.isArray(schemaType)
    ? schemaType[0]
    : schemaType || "";
  const componentName = COMPONENT_TYPES[type];

  // If the type is not defined and the schema uses 'anyOf' or 'oneOf', don't
  // render a field and let the MultiSchemaField component handle the form display
  if (!componentName && (schema.anyOf || schema.oneOf)) {
    return () => null;
  }

  return componentName in fields
    ? fields[componentName]
    : () => {
        const UnsupportedFieldTemplate = getTemplate<
          "UnsupportedFieldTemplate",
          T,
          F
        >("UnsupportedFieldTemplate", registry, uiOptions);

        return (
          <UnsupportedFieldTemplate
            schema={schema}
            idSchema={idSchema}
            reason={`Unknown field type ${schema.type}`}
            registry={registry}
          />
        );
      };
}

/** The `Help` component renders any help desired for a field
 *
 * @param props - The id and help information to be rendered
 */
function Help(props: { id: string; help?: string | React.ReactElement }) {
  const { id, help } = props;
  if (!help) {
    return null;
  }
  if (typeof help === "string") {
    return (
      <p id={id} className="help-block">
        {help}
      </p>
    );
  }
  return (
    <div id={id} className="help-block">
      {help}
    </div>
  );
}

/** The `ErrorList` component renders the errors local to the particular field
 *
 * @param props - The list of errors to show
 */
function ErrorList(props: { errors?: string[] }) {
  const { errors = [] } = props;
  if (errors.length === 0) {
    return null;
  }

  return (
    <div>
      <ul className="error-detail bs-callout bs-callout-info">
        {errors
          .filter((elem) => !!elem)
          .map((error, index) => {
            return (
              <li className="text-danger" key={index}>
                {error}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

/** The `SchemaFieldRender` component is the work-horse of react-jsonschema-form, determining what kind of real field to
 * render based on the `schema`, `uiSchema` and all the other props. It also deals with rendering the `anyOf` and
 * `oneOf` fields.
 *
 * @param props - The `FieldProps` for this component
 */
function SchemaFieldRender<T, F>(props: FieldProps<T, F>) {
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
  const { formContext, schemaUtils } = registry;
  const uiOptions = getUiOptions<T, F>(uiSchema);
  const FieldTemplate = getTemplate<"FieldTemplate", T, F>(
    "FieldTemplate",
    registry,
    uiOptions
  );
  const DescriptionFieldTemplate = getTemplate<
    "DescriptionFieldTemplate",
    T,
    F
  >("DescriptionFieldTemplate", registry, uiOptions);
  const schema = schemaUtils.retrieveSchema(_schema, formData);
  const idSchema = mergeObjects(
    schemaUtils.toIdSchema(
      schema,
      _idSchema.$id,
      formData,
      idPrefix,
      idSeparator
    ),
    _idSchema
  ) as IdSchema<T>;
  const FieldComponent = getFieldComponent(
    schema,
    uiOptions,
    idSchema,
    registry
  );
  const disabled = Boolean(props.disabled || uiOptions.disabled);
  const readonly = Boolean(
    props.readonly ||
      uiOptions.readonly ||
      props.schema.readOnly ||
      schema.readOnly
  );
  const uiSchemaHideError = uiOptions.hideError;
  // Set hideError to the value provided in the uiSchema, otherwise stick with the prop to propagate to children
  const hideError =
    uiSchemaHideError === undefined
      ? props.hideError
      : Boolean(uiSchemaHideError);
  const autofocus = Boolean(props.autofocus || uiOptions.autofocus);
  if (Object.keys(schema).length === 0) {
    return null;
  }

  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema);

  const { __errors, ...fieldErrorSchema } = errorSchema || {};
  // See #439: uiSchema: Don't pass consumed class names to child components
  const fieldUiSchema = omit(uiSchema, ["ui:classNames", "classNames"]);
  if ("ui:options" in fieldUiSchema) {
    fieldUiSchema["ui:options"] = omit(fieldUiSchema["ui:options"], [
      "classNames",
    ]);
  }

  const field = (
    <FieldComponent
      {...props}
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
    label = uiOptions.title || props.schema.title || schema.title || name;
  }

  const description =
    uiOptions.description ||
    props.schema.description ||
    schema.description ||
    "";
  const errors = __errors;
  const help = uiOptions.help;
  const hidden = uiOptions.widget === "hidden";

  const classNames = ["form-group", "field", `field-${schema.type}`];
  if (!hideError && errors && errors.length > 0) {
    classNames.push("field-error has-error has-danger");
  }
  if (uiSchema?.classNames) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "'uiSchema.classNames' is deprecated and may be removed in a major release; Use 'ui:classNames' instead."
      );
    }
    classNames.push(uiSchema.classNames);
  }
  if (uiOptions.classNames) {
    classNames.push(uiOptions.classNames);
  }

  const fieldProps: Omit<FieldTemplateProps<T, F>, "children"> = {
    description: (
      <DescriptionFieldTemplate
        id={`${id}__description`}
        description={description}
        registry={registry}
      />
    ),
    rawDescription: description,
    help: <Help id={`${id}__help`} help={help} />,
    rawHelp: typeof help === "string" ? help : undefined,
    errors: hideError ? undefined : <ErrorList errors={errors} />,
    rawErrors: hideError ? undefined : errors,
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
    classNames: classNames.join(" ").trim(),
    formContext,
    formData,
    schema,
    uiSchema,
    registry,
  };

  const _AnyOfField = registry.fields.AnyOfField;
  const _OneOfField = registry.fields.OneOfField;

  return (
    <FieldTemplate {...fieldProps}>
      <>
        {field}
        {/*
        If the schema `anyOf` or 'oneOf' can be rendered as a select control, don't
        render the selection and let `StringField` component handle
        rendering
      */}
        {schema.anyOf &&
          !uiSchema?.["ui:field"] &&
          !schemaUtils.isSelect(schema) && (
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
              options={schema.anyOf.map((_schema: RJSFSchemaDefinition) =>
                schemaUtils.retrieveSchema(
                  isObject(_schema) ? _schema : {},
                  formData
                )
              )}
              baseType={schema.type}
              registry={registry}
              schema={schema}
              uiSchema={uiSchema}
            />
          )}
        {schema.oneOf &&
          !uiSchema?.["ui:field"] &&
          !schemaUtils.isSelect(schema) && (
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
              options={schema.oneOf.map((_schema: RJSFSchemaDefinition) =>
                schemaUtils.retrieveSchema(
                  isObject(_schema) ? _schema : {},
                  formData
                )
              )}
              baseType={schema.type}
              registry={registry}
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
class SchemaField<T = any, F = any> extends React.Component<FieldProps<T, F>> {
  shouldComponentUpdate(nextProps: Readonly<FieldProps<T, F>>) {
    return !deepEquals(this.props, nextProps);
  }

  render() {
    return <SchemaFieldRender<T, F> {...this.props} />;
  }
}

export default SchemaField;
