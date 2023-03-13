import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Text } from '@fluentui/react';

export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ description, id }: DescriptionFieldProps<T, S, F>) {
  if (description) {
    return <Text id={id}>{description}</Text>;
  }

  return null;
}
