import type { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';

import { Separator } from '../components/ui/separator.tsx';

/** The `TitleField` is the template to use to render the title of a field. Its `id` goes on the title's text alone, as
 * an option selector beside a container's options is named by it, and the required marker and the optional data
 * control aren't part of that name
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, title, required, optionalDataControl }: TitleFieldProps<T, S, F>) {
  let heading = (
    <h5>
      <span id={id}>{title}</span>
      {required ? '*' : null}
    </h5>
  );
  if (optionalDataControl) {
    heading = (
      <div className='flex flex-row'>
        <div className='flex-grow'>{heading}</div>
        <div className='flex'>{optionalDataControl}</div>
      </div>
    );
  }
  return (
    <div className='my-1 flex flex-col gap-0.5'>
      {heading}
      <Separator dir='horizontal' style={{ height: '1px' }} className='my-1' />
    </div>
  );
}
