import { ReactNode, Children, isValidElement } from 'react';
import {
  ArrayFieldItemTemplateType,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldItemTemplateType<T, S, F> & { index?: number; isLastItem?: boolean }) {
  const { children, className, buttonsProps, hasToolbar, registry, uiSchema, index, isLastItem } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions
  );

  // Different styling for first, middle, and last items to create connected feel
  const isFirstItem = index === 0;
  const borderRadius = isFirstItem
    ? 'rounded-t-xl rounded-b-none'
    : isLastItem
    ? 'rounded-t-none rounded-b-xl'
    : 'rounded-none';

  const borderStyle = isLastItem ? 'border-b' : 'border-b-0';
  const marginBottom = isLastItem ? 'mb-4' : 'mb-0';

  return (
    <div
      className={`card bg-base-100 shadow-sm border border-base-300 ${borderRadius} ${borderStyle} ${marginBottom} ${
        index === undefined ? '' : 'z-' + (10 - Math.min(index, 9))
      }`}
    >
      <div className='card-body p-4'>
        <div className='flex flex-col gap-3'>
          {/* Content area */}
          <div className='w-full'>{children}</div>

          {/* Toolbar buttons in a separate row under content */}
          {hasToolbar && (
            <div className='flex justify-end mt-2'>
              <div className='join'>
                <ArrayFieldItemButtonsTemplate {...buttonsProps} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
