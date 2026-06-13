import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ID_KEY, TranslatableString } from '@rjsf/utils';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

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
    <div className='mt-4'>
      <Alert variant='default' className='mb-2'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>{translateString(TranslatableString.CycleDetected, [name])}</AlertDescription>
      </Alert>
      <Button
        id={buttonId}
        type='button'
        variant='outline'
        size='sm'
        className={cn('my-1')}
        onClick={() => onExpand(fieldPathId[ID_KEY])}
      >
        {translateString(TranslatableString.ExpandButton)}
      </Button>
    </div>
  );
}
