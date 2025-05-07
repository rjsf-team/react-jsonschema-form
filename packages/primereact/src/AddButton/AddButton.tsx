import { Button } from 'primereact/button';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

/** The `AddButton` renders a button that represents the `Add` action on a form
 */
export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  color,
  ...props
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button
      label={translateString(TranslatableString.AddItemButton)}
      icon='pi pi-plus'
      outlined
      severity='secondary'
      size='small'
      {...props}
    />
  );
}
