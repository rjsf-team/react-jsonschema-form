import { CSSProperties } from 'react';
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
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const { children, className, buttonsProps, hasToolbar, registry, uiSchema } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions
  );

  return (
    <div className='flex items-center gap-4 p-2 mb-2 bg-base-100 rounded-lg hover:bg-base-200'>
      <div className='flex-1'>{children}</div>
      {hasToolbar && (
        <div className='flex-none'>
          <div className='join'>
            <ArrayFieldItemButtonsTemplate {...buttonsProps} />
          </div>
        </div>
      )}
    </div>
  );
}
