import { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
}: TitleFieldProps<T, S, F>) {
  return (
    <div
      id={id}
      style={{
        marginBlockEnd: '0.5rem',
      }}
    >
      {title}
    </div>
  );
}
