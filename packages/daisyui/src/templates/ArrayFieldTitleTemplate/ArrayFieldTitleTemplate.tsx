import type { ArrayFieldTitleProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { getUiOptions, titleId } from '@rjsf/utils';

/** The `ArrayFieldTitleTemplate` component renders the title for an array field
 * using DaisyUI styling with large bold text, its text carrying the title id derived from the field `id`, and a `*`
 * beside it for a required array.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { id, title, required, uiSchema, registry, optionalDataControl } = props;
  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { label: displayLabel = true } = options;
  if (!title || !displayLabel) {
    return null;
  }
  // The id is on the title's text alone, as `TitleField`'s is, not on its required marker
  let heading = (
    <h3 className='text-2xl font-bold'>
      <span id={titleId(id)}>{title}</span>
      {required && <span className='text-error ml-1'>*</span>}
    </h3>
  );
  if (optionalDataControl) {
    heading = (
      <>
        <div className='flex flex-col'>{heading}</div>
        <div className='flex justify-end'>{optionalDataControl}</div>
      </>
    );
  }

  return heading;
}
