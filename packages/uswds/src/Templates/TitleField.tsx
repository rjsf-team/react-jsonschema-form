import { TitleFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function TitleField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, title, required }: TitleFieldProps<T, S, F>) {
  if (!title) {
    return null;
  }

  return (
    <h1 id={id} className="usa-heading">
      {title}
      {required && <span className="usa-label--required">*</span>}
    </h1>
  );
}
