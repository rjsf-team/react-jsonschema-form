import { Button } from '@chakra-ui/react';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { PlusIcon } from 'lucide-react';

export default function AddButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ registry, title, ...props }: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button
      title={
        title
          ? translateString(TranslatableString.AddNamedButton, [title])
          : translateString(TranslatableString.AddItemButton)
      }
      {...props}
    >
      <PlusIcon />
    </Button>
  );
}
