import { Fieldset, Box, Group } from '@mantine/core';
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
    items,
    optionalDataControl,
    onAddClick,
    readonly,
    required,
    schema,
    uiSchema,
    title,
    presentation,
    registry,
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { ArrayFieldDescriptionTemplate, ArrayFieldTitleTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const shownDescription = getArrayDescription<T, S, F>(props);
  const showOptionalDataControlInTitle = titleDrawsOptionalDataControl<T, S, F>(props);
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const legend = title && (
    <ArrayFieldTitleTemplate
      id={id}
      required={required}
      title={title}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
      optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
    />
  );

  return (
    <Fieldset legend={legend} className={className} id={id}>
      {shownDescription && (
        <ArrayFieldDescriptionTemplate
          description={shownDescription}
          id={id}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
          presentation={presentation}
        />
      )}
      <Box className='row rjsf-array-item-list'>
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {items}
      </Box>
      {canAdd && (
        <Group justify='flex-end'>
          <AddButton
            id={buttonId(id, 'add')}
            className='rjsf-array-item-add'
            disabled={disabled || readonly}
            onClick={onAddClick}
            uiSchema={uiSchema}
            registry={registry}
            iconType='md'
          />
        </Group>
      )}
    </Fieldset>
  );
}
