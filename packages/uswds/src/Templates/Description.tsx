import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function Description<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  { description, id }: DescriptionFieldProps<T, S, F>
) {
  if (!description) {
    return null;
  }

  if (typeof description === 'string') {
    return <div id={id} className="usa-hint">{description}</div>;
  }

  return <div id={id} className="usa-hint">{description}</div>;
}
