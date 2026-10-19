import type { ArrayFieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getArrayDescription, getTemplates, getUiOptions, buttonId, titleDrawsOptionalDataControl } from '@rjsf/utils';

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateProps` props for the component
 */
export default function ArrayFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    canAdd,
    className,
    disabled,
    id,
    uiSchema,
    items,
    optionalDataControl,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
    presentation,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { ArrayFieldDescriptionTemplate, ArrayFieldTitleTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const showOptionalDataControlInTitle = titleDrawsOptionalDataControl<T, S, F>(props);
  const shownDescription = getArrayDescription<T, S, F>(props);
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <fieldset className={className} id={id}>
      <ArrayFieldTitleTemplate
        id={id}
        title={title}
        required={required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
        optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
      />
      <ArrayFieldDescriptionTemplate
        id={id}
        description={shownDescription}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
        presentation={presentation}
      />
      {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
      <div className='row array-item-list'>{items}</div>
      {canAdd && (
        <AddButton
          id={buttonId(id, 'add')}
          className='rjsf-array-item-add'
          onClick={onAddClick}
          disabled={disabled || readonly}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </fieldset>
  );
}
