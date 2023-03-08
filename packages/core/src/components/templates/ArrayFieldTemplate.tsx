import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

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
    <fieldset className={className} id={idSchema.$id}>
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={uiOptions.title || title}
        required={required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <ArrayFieldDescriptionTemplate
        idSchema={idSchema}
        description={uiOptions.description || schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <div className='row array-item-list'>
        {items &&
          items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType<T, S, F>) => (
            <ArrayFieldItemTemplate key={key} {...itemProps} />
          ))}
      </div>
      {canAdd && (
        <AddButton
          className='array-item-add'
          onClick={onAddClick}
          disabled={disabled || readonly}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </fieldset>
  );
}
