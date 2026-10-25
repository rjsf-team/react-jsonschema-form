import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { PlusCircle } from 'lucide-react';

import { Button } from '../components/ui/button.tsx';
import { cn } from '../lib/utils.ts';

/**
 * A button component for adding new items in a form
 * @param uiSchema - The UI schema for the form, which can include custom properties
 * @param registry - The registry object containing the form's configuration and utilities
 * @param className - Allow custom class names to be passed for Tailwind CSS styling
 * @param props - The component properties
 */
export default function AddButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema, registry, className, ...props }: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  // Core's array and object templates render it straight into their fieldset, so it aligns itself to the end
  return (
    <Button {...props} className={cn('mt-2 ml-auto flex w-fit gap-2', className)} variant='outline' type='button'>
      <PlusCircle size={16} /> {translateString(TranslatableString.AddItemButton)}
    </Button>
  );
}
