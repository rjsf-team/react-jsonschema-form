import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Fieldset, Box, Group } from '@mantine/core';

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    canAdd,
    className,
    disabled,
    idSchema,
    items,
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
    uiOptions
  );
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T, S, F>(
    'ArrayFieldItemTemplate',
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const legend = (uiOptions.title || title) && (
    <ArrayFieldTitleTemplate
      idSchema={idSchema}
      required={required}
      title={uiOptions.title || title}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    />
  );

  return (
    <Fieldset legend={legend} className={className} id={idSchema.$id}>
      {(uiOptions.description || schema.description) && (
        <ArrayFieldDescriptionTemplate
          description={uiOptions.description || schema.description}
          idSchema={idSchema}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}

      <Box className='row array-item-list'>
        {items &&
          items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType<T, S, F>) => (
            <ArrayFieldItemTemplate key={key} {...itemProps} />
          ))}
      </Box>

      {canAdd && (
        <Group justify='flex-end'>
          <AddButton
            className='array-item-add'
            disabled={disabled || readonly}
            onClick={onAddClick}
            uiSchema={uiSchema}
            registry={registry}
          />
        </Group>
      )}
    </Fieldset>
  );
}
