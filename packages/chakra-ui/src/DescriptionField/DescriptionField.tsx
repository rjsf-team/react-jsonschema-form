import { RichDescription } from '@rjsf/core';
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Text } from '@chakra-ui/react';

/** The `DescriptionField` is the template to use to render the description of a field
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ description, id, registry, uiSchema }: DescriptionFieldProps<T, S, F>) {
  if (!description) {
    return null;
  }

  return (
    <Text as='sup' fontSize='md' id={id}>
      <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
    </Text>
  );
}
