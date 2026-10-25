import type { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';

import { Separator } from '../components/ui/separator.tsx';

/** The `TitleField` is the template to use to render the title of a field. It is a `<legend>`, so the `<fieldset>` of an
 * object or array it heads takes the title as its name, and the separator follows it, since a legend holds only text and
 * headings. Its `id` goes on the title's text alone, as an option selector beside a container's options is named by it,
 * and the required marker and the optional data control aren't part of that name
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, title, required, optionalDataControl }: TitleFieldProps<T, S, F>) {
  return (
    <>
      <legend className='my-1 flex w-full items-center'>
        <h5 className='grow'>
          <span id={id}>{title}</span>
          {required ? '*' : null}
        </h5>
        {optionalDataControl}
      </legend>
      <Separator dir='horizontal' style={{ height: '1px' }} className='my-1' />
    </>
  );
}
