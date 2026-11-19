import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { PlusIcon } from 'lucide-react';

import ChakraIconButton from '../IconButton/ChakraIconButton.tsx';

export default function AddButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <ChakraIconButton<T, S, F>
      title={translateString(TranslatableString.AddItemButton)}
      {...props}
      icon={<PlusIcon />}
    />
  );
}
