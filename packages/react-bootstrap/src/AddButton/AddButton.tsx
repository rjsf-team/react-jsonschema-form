import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import Button from 'react-bootstrap/Button';
import { BsPlus } from '@react-icons/all-files/bs/BsPlus';

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
