import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { PlusCircle } from 'lucide-react';

import { Button } from '../components/ui/button';

/**
 * A button component for adding new items in a form
 * @param props - The component properties
 */
export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  ...props
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <div className='p-0 m-0'>
      <Button {...props} className='w-fit gap-2' variant='outline' type='button'>
        <PlusCircle size={16} /> {translateString(TranslatableString.AddItemButton)}
      </Button>
    </div>
  );
}
