import { helpId, FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Text } from '@mantine/core';

export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldHelpProps<T, S, F>) {
  const { idSchema, help } = props;

  const id = helpId<T>(idSchema);

  return !help ? null : (
    <Text id={id} size='sm' my='xs' c='dimmed'>
      {help}
    </Text>
  );
}
