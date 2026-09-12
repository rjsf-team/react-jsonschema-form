import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { Alert, Button } from 'react-bootstrap';

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
    <div className='mt-3'>
      <Alert variant='warning'>{translateString(TranslatableString.CycleDetected, [name])}</Alert>
      <Button id={buttonId} variant='warning' size='sm' onClick={() => onExpand(id)}>
        {translateString(TranslatableString.ExpandButton)}
      </Button>
    </div>
  );
}
