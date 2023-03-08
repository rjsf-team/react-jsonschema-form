import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Text } from '@chakra-ui/react';

export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ description, id }: DescriptionFieldProps<T, S, F>) {
  if (!description) {
    return null;
  }

  if (typeof description === 'string') {
    return (
      <Text id={id} mt={2} mb={4}>
        {description}
      </Text>
    );
  }

  return <>{description}</>;
}
