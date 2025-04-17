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
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const { children, buttonsProps, hasToolbar, uiSchema, registry } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );
  return (
    <div>
      <div className='mb-2 flex flex-row flex-wrap'>
        <div className='grow shrink'>{children}</div>
        <div className='flex items-end justify-end p-0.5'>
          {hasToolbar && (
            <div className='flex gap-2'>
              <ArrayFieldItemButtonsTemplate {...buttonsProps} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
