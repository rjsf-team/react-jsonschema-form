import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { PlusCircle } from 'lucide-react';

import IconButton from '../IconButton/IconButton.tsx';

/**
 * A button component for adding new items in a form
 * @param props - The component properties
 */
export default function AddButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.AddItemButton)}
      {...props}
      icon={<PlusCircle className='h-4 w-4' />}
    />
  );
}
