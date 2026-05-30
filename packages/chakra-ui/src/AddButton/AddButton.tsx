import { Button } from '@chakra-ui/react';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { PlusIcon } from 'lucide-react';

export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  registry,
  ...props
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button {...props}>
      <PlusIcon />
      {translateString(TranslatableString.AddItemButton)}
    </Button>
  );
}
