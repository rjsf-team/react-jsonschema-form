import { BsPlus } from '@react-icons/all-files/bs/BsPlus.js';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { Button } from 'react-bootstrap';

export default function AddButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema, registry, ...props }: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button
      title={translateString(TranslatableString.AddItemButton)}
      {...props}
      style={{ width: '100%' }}
      className={`ml-1 ${props.className}`}
    >
      <BsPlus />
    </Button>
  );
}
