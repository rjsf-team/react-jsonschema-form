// @ts-expect-error there's no type definition for Stack
import { Stack } from '@carbon/react';
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
} from '@rjsf/utils';
import { Layer, LayerBackground } from '../components/Layer';

/** Implement `ArrayFieldTemplate`
 */
export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    className,
    canAdd,
    disabled,
    idSchema,
    uiSchema,
    items,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
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
  return (
    <div className={className} id={idSchema.$id}>
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={uiOptions.title || title}
        schema={schema}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
      />
      <ArrayFieldDescriptionTemplate
        idSchema={idSchema}
        description={uiOptions.description || schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <LayerBackground>
        <Stack gap={7}>
          {items.length > 0 && (
            <Layer>
              <Stack gap={7} className='array-item-list'>
                {items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType<T, S, F>) => (
                  <ArrayFieldItemTemplate key={key} {...itemProps} />
                ))}
              </Stack>
            </Layer>
          )}
          {canAdd && (
            <AddButton
              className='array-item-add'
              onClick={onAddClick}
              disabled={disabled || readonly}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
        </Stack>
      </LayerBackground>
    </div>
  );
}
