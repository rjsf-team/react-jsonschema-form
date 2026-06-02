import { Button } from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  ...props
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return <Button title={translateString(TranslatableString.AddItemButton)} {...props} icon={<AddRegular />} />;
}
