import { Alert, Button, Group } from '@mantine/core';
import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

import { ExclamationCircle } from './icons.tsx';

/** The `CyclicSchemaExpandTemplate` is the template to use to render the cyclic schema expand message and controls
 *
 * @param props - The `CyclicSchemaExpandProps` for this component
 */
export default function CyclicSchemaExpandTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, id, registry, onExpand } = props;
  const { translateString } = registry;
  const buttonId = `${id}-button`;
  return (
    <Alert
      color='yellow'
      variant='transparent'
      title={translateString(TranslatableString.CycleDetected, [name])}
      icon={<ExclamationCircle />}
      mt='md'
    >
      <Group>
        <Button id={buttonId} size='xs' variant='outline' color='yellow' onClick={() => onExpand(id)}>
          {translateString(TranslatableString.ExpandButton)}
        </Button>
      </Group>
    </Alert>
  );
}
