import { FormText } from '@appfolio/react-gears';
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function DescriptionFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ id, description }: DescriptionFieldProps<T, S, F>) {
  if (description) {
    return <FormText id={id}>{description}</FormText>;
  }

  return null;
}
