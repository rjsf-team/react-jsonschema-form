import {
  ArrayFieldItemTemplateType,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

/** The `ArrayFieldItemTemplate` component is the template used to render an item of an array.
 *
 * This DaisyUI implementation:
 * - Uses the fieldset component for proper form grouping
 * - Maintains connected appearance for multiple items
 * - Positions items with z-index to create a stacked effect
 * - Places action buttons in an easily accessible location
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component with additional properties:
 * @param props.index - The position of this item in the array (optional)
 * @param props.totalItems - The total number of items in the array (optional)
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const { children, buttonsProps, hasToolbar, registry, uiSchema, index, totalItems } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );

  // Different styling for first, middle, and last items to create connected feel
  const isFirstItem = index === 0;
  const isLastItem = index === totalItems - 1;
  const borderRadius = isFirstItem ? 'rounded-t-lg' : isLastItem ? 'rounded-b-lg' : '';
  const marginBottom = isLastItem ? '' : 'mb-[-1px]';
  const zIndex = index === undefined ? '' : 'z-' + (10 - Math.min(index, 9));

  return (
    <fieldset className={`fieldset bg-base-100 border border-base-300 p-4 ${borderRadius} ${marginBottom} ${zIndex}`}>
      {/* Main content area */}
      {children}

      {/* Action buttons */}
      {hasToolbar && (
        <div className='flex justify-end mt-2'>
          <ArrayFieldItemButtonsTemplate {...buttonsProps} />
        </div>
      )}
    </fieldset>
  );
}
