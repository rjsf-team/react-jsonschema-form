import { Box, Button } from '@chakra-ui/react';
import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ID_KEY, TranslatableString } from '@rjsf/utils';

import { Alert } from '../components/ui/alert';

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
    <Box mt={4}>
      <Alert status='warning' title={translateString(TranslatableString.CycleDetected, [name])} mb={2} />
      <Button id={buttonId} size='sm' variant='outline' onClick={() => onExpand(fieldPathId[ID_KEY])}>
        {translateString(TranslatableString.ExpandButton)}
      </Button>
    </Box>
  );
}
