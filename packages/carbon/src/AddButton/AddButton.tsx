import { Add } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

/** Implement `ButtonTemplates.AddButton`
 */
export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  ...props
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button size='sm' kind='tertiary' renderIcon={Add} {...props}>
      {translateString(TranslatableString.AddItemButton)}
    </Button>
  );
}
