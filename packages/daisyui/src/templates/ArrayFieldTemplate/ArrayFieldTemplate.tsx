import { ArrayFieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema, getUiOptions } from '@rjsf/utils';
import ArrayFieldTitleTemplate from '../ArrayFieldTitleTemplate/ArrayFieldTitleTemplate';
import ArrayFieldDescriptionTemplate from '../ArrayFieldDescriptionTemplate/ArrayFieldDescriptionTemplate';
import ArrayFieldItemTemplate from '../ArrayFieldItemTemplate/ArrayFieldItemTemplate';

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
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

  // Get templates directly from registry
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  return (
    <div className={className}>
      <ArrayFieldTitleTemplate
        title={title}
        required={required}
        idSchema={idSchema}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <ArrayFieldDescriptionTemplate
        description={uiOptions.description || schema.description}
        idSchema={idSchema}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <div className='array-item-list'>
        {items.map((item) => (
          <ArrayFieldItemTemplate {...item} />
        ))}
      </div>
      {canAdd && (
        <div className='flex flex-row justify-end'>
          <AddButton
            className='btn btn-primary'
            onClick={onAddClick}
            disabled={disabled || readonly}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      )}
    </div>
  );
}
