import { BsPlus } from '@react-icons/all-files/bs/BsPlus';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import Button from 'react-bootstrap/Button';

export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  ...props
}: IconButtonProps<T, S, F>) {
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
