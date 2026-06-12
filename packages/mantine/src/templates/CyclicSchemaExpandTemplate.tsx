import { Alert, Button, Group } from '@mantine/core';
import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ID_KEY, TranslatableString } from '@rjsf/utils';

import { ExclamationCircle } from './icons';

/** The `CyclicSchemaExpandTemplate` is the template to use to render the cyclic schema expand message and controls
 *
 * @param props - The `CyclicSchemaExpandProps` for this component
 */
export default function CyclicSchemaExpandTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, fieldPathId, registry, onExpand } = props;
  const { translateString } = registry;
  const buttonId = `${fieldPathId[ID_KEY]}-button`;
  return (
    <Alert
      color='yellow'
      variant='transparent'
      title={translateString(TranslatableString.CycleDetected, [name])}
      icon={<ExclamationCircle />}
      mt='md'
    >
      <Group>
        <Button id={buttonId} size='xs' variant='outline' color='yellow' onClick={() => onExpand(fieldPathId[ID_KEY])}>
          {translateString(TranslatableString.ExpandButton)}
        </Button>
      </Group>
    </Alert>
  );
}
