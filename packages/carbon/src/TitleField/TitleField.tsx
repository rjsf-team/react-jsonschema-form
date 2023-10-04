import { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';
import { ConditionLabel } from '../components/ConditionLabel';

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
