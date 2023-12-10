import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { Button } from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons';

export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  ...props
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return <Button {...props} icon={<AddRegular />} title={translateString(TranslatableString.AddItemButton)} />;
}
