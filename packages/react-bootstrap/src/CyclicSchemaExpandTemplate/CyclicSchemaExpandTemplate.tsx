import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ID_KEY, TranslatableString } from '@rjsf/utils';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';

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
    <div className='mt-3'>
      <Alert variant='warning'>{translateString(TranslatableString.CycleDetected, [name])}</Alert>
      <Button id={buttonId} variant='warning' size='sm' onClick={() => onExpand(fieldPathId[ID_KEY])}>
        {translateString(TranslatableString.ExpandButton)}
      </Button>
    </div>
  );
}
