import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
  TranslatableString,
} from '@rjsf/utils';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
library.add(faPlus);

export function ArrayFieldTemplate<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ArrayFieldTemplateProps<T, S, F>
) {
  const { canAdd, disabled, idSchema, uiSchema, items, onAddClick, readonly, registry, required, schema, title } =
    props;
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
  // Get button templates directly from registry
  const { ButtonTemplates } = registry.templates;
  const { AddButton, RemoveButton, MoveUpButton, MoveDownButton } = ButtonTemplates;
  console.log('ArrayFieldTemplate props:', {
    items,
    schema,
    formData: props.formData,
    onAddClick,
  });
  return (
    <div className='array-field'>
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
      {items.length > 0 && (
        <div className='array-item-list my-4'>
          {items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType<T, S, F>) => (
            <ArrayFieldItemTemplate key={`${idSchema.$id}_${key}`} {...itemProps} registry={registry} />
          ))}
        </div>
      )}
      {canAdd && (
        <AddButton
          className='btn btn-primary my-4'
          onClick={onAddClick}
          disabled={disabled || readonly}
          registry={registry}
        />
      )}
    </div>
  );
}

export default ArrayFieldTemplate;
