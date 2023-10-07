import { Add } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  ...props
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button size='sm' kind='ghost' renderIcon={Add} {...props}>
      {translateString(TranslatableString.AddItemButton)}
    </Button>
  );
}
