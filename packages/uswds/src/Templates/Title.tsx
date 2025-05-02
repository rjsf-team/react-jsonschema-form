import { TitleFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function Title<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  { id, title }: TitleFieldProps<T, S, F>
) {
  if (!title) {
    return null;
  }

  return <h2 id={id} className="usa-legend">{title}</h2>;
}
