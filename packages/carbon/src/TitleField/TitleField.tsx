import { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';
import { ConditionLabel } from '../components/ConditionLabel';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
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
      <ConditionLabel label={title} required={required} hide={false} />
    </div>
  );
}
