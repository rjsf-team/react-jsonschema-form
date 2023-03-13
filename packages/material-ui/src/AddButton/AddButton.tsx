import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
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
    <IconButton title={translateString(TranslatableString.AddItemButton)} {...props} color='primary'>
      <AddIcon />
    </IconButton>
  );
}
