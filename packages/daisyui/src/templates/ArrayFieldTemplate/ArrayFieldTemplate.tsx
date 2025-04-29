import React, { useCallback } from 'react';
import {
  ArrayFieldTemplateProps,
  getTemplate,
  getUiOptions,
  Registry,
  RJSFSchema,
  FormContextType,
  TranslatableString,
  buttonId,
} from '@rjsf/utils';

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * This DaisyUI implementation:
 * - Renders the entire array in a rounded container with base-200 background
 * - Uses custom ArrayFieldTitleTemplate and ArrayFieldDescriptionTemplate
 * - Displays an info alert when the array is empty
 * - Renders each array item using ArrayFieldItemTemplate with additional props
 * - Positions the add button at the bottom right using flexbox
 * - Uses DaisyUI's button styling for the add button
 * - Maintains proper spacing with margin and padding utilities
 *
 * @param props - The `ArrayFieldTemplateProps` for the component
 */
export default function ArrayFieldTemplate<T = any, S extends RJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ArrayFieldTemplateProps<T, S, F>,
) {
  const {
    canAdd,
    className,
    disabled,
    idSchema,
    items,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
    uiSchema,
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    registry as Registry<T, S, F>,
    uiOptions,
  );
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T, S, F>(
    'ArrayFieldItemTemplate',
    registry as Registry<T, S, F>,
    uiOptions,
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry as Registry<T, S, F>,
    uiOptions,
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  /** Handle the add button click
   *
   * @param e - The click event
   */
  const handleAddClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onAddClick(e);
    },
    [onAddClick],
  );

  return (
    <div className={`array-field-template ${className}`}>
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
      <div className='flex flex-col gap-4'>
        <div className='rjsf-array-item-list'>
          {items &&
            items.map(({ key, ...itemProps }, index) => (
              <ArrayFieldItemTemplate key={key} {...itemProps} index={index} totalItems={items.length} />
            ))}
          {items && items.length === 0 && canAdd && (
            <div className='text-center italic text-base-content/70'>{TranslatableString.EmptyArray}</div>
          )}
        </div>
        {canAdd && (
          <div className='flex justify-end'>
            <AddButton
              id={buttonId<T>(idSchema, 'add')}
              className='rjsf-array-item-add btn btn-primary btn-sm'
              onClick={handleAddClick}
              disabled={disabled || readonly}
              uiSchema={uiSchema}
              registry={registry}
            />
          </div>
        )}
      </div>
    </div>
  );
}
