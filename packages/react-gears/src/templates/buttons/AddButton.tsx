import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { HasManyFieldsAdd } from '@appfolio/react-gears';

export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  ...props
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return <HasManyFieldsAdd {...props}>{translateString(TranslatableString.AddItemButton)}</HasManyFieldsAdd>;
}
