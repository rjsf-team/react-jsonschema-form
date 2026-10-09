import type {
  FieldProps,
  FormContextType,
  OptionalDataControlsTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import {
  getOptionalDataControlsType,
  getTemplates,
  getUiOptions,
  isFormDataAvailable,
  optionalControlsId,
  TranslatableString,
} from '@rjsf/utils';

/** The `OptionalDataControlsField` component is used to render the optional data controls for the field associated
 * with the given props.
 *
 * @param props - The `FieldProps` for this template
 */
export default function OptionalDataControlsField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F>) {
  const {
    schema,
    uiSchema = {},
    formData,
    disabled = false,
    readonly = false,
    onChange,
    fieldPath,
    id: fieldId,
    registry,
  } = props;

  const { globalUiOptions = {}, schemaUtils, translateString, uiSchemaDefinitions } = registry;
  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const { OptionalDataControlsTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const hasFormData = isFormDataAvailable<T>(formData);
  let id: string;
  let label: string | undefined;
  let onAddClick: OptionalDataControlsTemplateProps['onAddClick'];
  let onRemoveClick: OptionalDataControlsTemplateProps['onRemoveClick'];
  if (disabled || readonly) {
    id = optionalControlsId(fieldId, 'Msg');
    label = hasFormData ? undefined : translateString(TranslatableString.OptionalObjectEmptyMsg);
  } else {
    const labelEnum = hasFormData ? TranslatableString.OptionalObjectRemove : TranslatableString.OptionalObjectAdd;
    label = translateString(labelEnum);
    if (hasFormData) {
      id = optionalControlsId(fieldId, 'Remove');
      onRemoveClick = () => onChange(undefined, fieldPath);
    } else {
      id = optionalControlsId(fieldId, 'Add');
      onAddClick = () => {
        // Passes uiSchema/uiSchemaDefinitions so a ui:initialValue on a field beneath this control applies immediately,
        // the same as it would if the field had been present since the initial render. Add is only offered when there
        // is no data to keep, so none is passed: a `null` held by a `['object', 'null']` would otherwise be kept as the
        // value of the type it is, and nothing would be added
        let newFormData: unknown = schemaUtils.getDefaultFormState(
          schema,
          undefined,
          'excludeObjectChildren',
          undefined,
          uiSchema,
          uiSchemaDefinitions,
        );
        if (newFormData === undefined) {
          // getDefaultFormState() returns undefined for an optional array (and can for an object), so Add has to supply
          // the empty container itself, of the type shouldRenderOptionalField() rendered the controls for
          newFormData = getOptionalDataControlsType<S>(schema) === 'array' ? [] : {};
        }
        onChange(newFormData as T, fieldPath);
      };
    }
  }
  return (
    label && (
      <OptionalDataControlsTemplate
        id={id}
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
