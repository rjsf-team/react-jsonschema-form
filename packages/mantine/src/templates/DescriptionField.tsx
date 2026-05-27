import { Text } from '@mantine/core';
import { RichDescription } from '@rjsf/core';
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `DescriptionField` is the template to use to render the description of a field
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description, registry, uiSchema } = props;
  if (description) {
    return (
      <Text id={id} mt={3} mb='sm'>
        <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
      </Text>
    );
  }

  return null;
}
