import {
  FieldProps,
  FormContextType,
  getSchemaType,
  getTemplate,
  getUiOptions,
  isFormDataAvailable,
  OptionalDataControlsTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';

/** The `OptionalDataControlsField` component is used to render the optional data controls for the field associated
 * with the given props.
 *
 * @param props - The `FieldProps` for this template
 */
export default function OptionalDataControlsField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldProps<T, S, F>) {
  const {
    schema,
    uiSchema = {},
    formData,
    disabled = false,
    readonly = false,
    onChange,
    errorSchema,
    fieldPathId,
    registry,
  } = props;

  const { globalUiOptions = {}, schemaUtils, translateString } = registry;
  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const OptionalDataControlsTemplate = getTemplate<'OptionalDataControlsTemplate', T, S, F>(
    'OptionalDataControlsTemplate',
    registry,
    uiOptions,
  );
  const hasFormData = isFormDataAvailable(formData);
  let label: string | undefined;
  let onAddClick: OptionalDataControlsTemplateProps['onAddClick'];
  let onRemoveClick: OptionalDataControlsTemplateProps['onRemoveClick'];
  if (disabled || readonly) {
    label = hasFormData ? undefined : translateString(TranslatableString.OptionalObjectEmptyMsg);
  } else {
    const labelEnum = hasFormData ? TranslatableString.OptionalObjectRemove : TranslatableString.OptionalObjectAdd;
    label = translateString(labelEnum);
    if (hasFormData) {
      onRemoveClick = () => onChange(undefined as T, fieldPathId.path, errorSchema);
    } else {
      onAddClick = () => {
        // If it has form data, store an empty object, otherwise use get the default form state and use it
        let newFormData: unknown = schemaUtils.getDefaultFormState(schema, formData, 'excludeObjectChildren');
        if (newFormData === undefined) {
          // If new form data ended up being undefined, and we have pushed the add button we need to actually add data
          newFormData = getSchemaType<S>(schema) === 'array' ? [] : {};
        }
        onChange(newFormData as T, fieldPathId.path, errorSchema);
      };
    }
  }
  return (
    label && (
      <OptionalDataControlsTemplate
        registry={registry}
        schema={schema}
        uiSchema={uiSchema}
        label={label}
        onAddClick={onAddClick}
        onRemoveClick={onRemoveClick}
      />
    )
  );
}
