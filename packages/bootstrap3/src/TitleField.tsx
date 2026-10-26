import type { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

const REQUIRED_FIELD_SYMBOL = '*';

/** The `TitleField` is the template to use to render the title of a field. Its `id` goes on the title's text alone, as
 * an option selector beside a container's options is named by it, and the marker and the optional data control aren't
 * part of that name
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: TitleFieldProps<T, S, F>) {
  const { id, title, required, optionalDataControl } = props;
  return (
    <legend>
      <span id={id}>{title}</span>
      {required && <span className='required'>{REQUIRED_FIELD_SYMBOL}</span>}
      {optionalDataControl && (
        <span className='pull-right' style={{ marginBottom: '2px' }}>
          {optionalDataControl}
        </span>
      )}
    </legend>
  );
}
