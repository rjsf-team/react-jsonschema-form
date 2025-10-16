import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  buttonId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Fieldset, Box, Group } from '@mantine/core';

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    canAdd,
    className,
    disabled,
    fieldPathId,
    items,
    optionalDataControl,
    onAddClick,
    readonly,
    required,
    schema,
    uiSchema,
    title,
    registry,
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions,
  );
  const showOptionalDataControlInTitle = !readonly && !disabled;
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const legend = (uiOptions.title || title) && (
    <ArrayFieldTitleTemplate
      fieldPathId={fieldPathId}
      required={required}
      title={uiOptions.title || title}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
      optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
    />
  );

  return (
    <Fieldset legend={legend} className={className} id={fieldPathId.$id}>
      {(uiOptions.description || schema.description) && (
        <ArrayFieldDescriptionTemplate
          description={uiOptions.description || schema.description}
          fieldPathId={fieldPathId}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Box className='row rjsf-array-item-list'>
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {items}
      </Box>
      {canAdd && (
        <Group justify='flex-end'>
          <AddButton
            id={buttonId(fieldPathId, 'add')}
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
