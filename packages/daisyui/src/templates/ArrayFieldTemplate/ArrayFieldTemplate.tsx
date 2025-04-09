import {
  ArrayFieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  buttonId,
  getUiOptions,
} from '@rjsf/utils';

import ArrayFieldTitleTemplate from '../ArrayFieldTitleTemplate/ArrayFieldTitleTemplate';
import ArrayFieldDescriptionTemplate from '../ArrayFieldDescriptionTemplate/ArrayFieldDescriptionTemplate';
import ArrayFieldItemTemplate from '../ArrayFieldItemTemplate/ArrayFieldItemTemplate';

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
    <div className={`${className} bg-base-200 p-4 rounded-xl mb-6`}>
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
      <div className='array-item-list mt-4'>
        {items.length === 0 && (
          <div className='alert alert-info'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              className='stroke-current shrink-0 w-6 h-6'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              ></path>
            </svg>
            <span>No items yet. Use the button below to add some.</span>
          </div>
        )}
        <div className='task-cards-container'>
          {items.map((item, idx) => (
            <ArrayFieldItemTemplate key={idx} {...item} index={idx} isLastItem={idx === items.length - 1} />
          ))}
        </div>
      </div>
      {canAdd && (
        <div className='flex flex-row justify-end mt-4'>
          <AddButton
            className='btn btn-primary btn-md'
            id={buttonId<T>(idSchema, 'add')}
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
