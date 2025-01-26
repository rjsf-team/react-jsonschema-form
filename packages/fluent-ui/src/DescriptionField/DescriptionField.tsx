import { DescriptionFieldProps, FormContextType, RichDescription, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Text } from '@fluentui/react';

export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ id, description, registry, uiSchema }: DescriptionFieldProps<T, S, F>) {
  if (!description) {
    return null;
  }

  return (
    <Text id={id}>
      <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
    </Text>
  );
}
