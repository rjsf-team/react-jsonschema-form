import { DescriptionFieldProps, FormContextType, RJSFSchema } from '@rjsf/utils';

export default function DescriptionField<T = any, S extends RJSFSchema = RJSFSchema, F extends FormContextType = any>({
  description,
  id,
}: DescriptionFieldProps<T, S, F>) {
  if (!description) {
    return null;
  }

  if (typeof description === 'string') {
    return <p id={id} className='usa-hint'>{description}</p>;
  }

  return <div id={id} className='usa-hint'>{description}</div>;
}
