import { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';
import { LabelValue } from '../components/LabelValue';

/** Implement `TitleFieldTemplate`
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  required,
}: TitleFieldProps<T, S, F>) {
  return (
    <div
      id={id}
      style={{
        marginBlockEnd: '0.5rem',
      }}
    >
      <LabelValue label={title} required={required} hide={false} />
    </div>
  );
}
