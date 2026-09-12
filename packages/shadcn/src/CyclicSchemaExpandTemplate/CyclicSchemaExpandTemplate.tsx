import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '../components/ui/alert.tsx';
import { Button } from '../components/ui/button.tsx';
import { cn } from '../lib/utils.ts';

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
        onClick={() => onExpand(id)}
      >
        {translateString(TranslatableString.ExpandButton)}
      </Button>
    </div>
  );
}
