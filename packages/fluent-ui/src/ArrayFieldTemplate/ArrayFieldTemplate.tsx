import { CSSProperties } from 'react';
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
} from '@rjsf/utils';

const rightJustify = {
  float: 'right',
} as CSSProperties;

export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateProps<T, S, F>) {
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
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <>
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
      {items.length > 0 &&
        items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType<T, S, F>) => (
          <ArrayFieldItemTemplate key={key} {...itemProps} />
        ))}
      {canAdd && (
        <span style={rightJustify}>
          <AddButton
            className='array-item-add'
            onClick={onAddClick}
            disabled={disabled || readonly}
            uiSchema={uiSchema}
            registry={registry}
          />
        </span>
      )}
    </>
  );
}
