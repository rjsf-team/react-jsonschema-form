import { ArrayFieldTitleProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

/** The `ArrayFieldTitleTemplate` component renders the title for an array field
 * using DaisyUI styling with large bold text.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { title } = props;
  return <h3 className='text-2xl font-bold'>{title}</h3>;
}
