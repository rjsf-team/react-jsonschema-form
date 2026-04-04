import AddIcon from '@mui/icons-material/Add';
import IconButton, { IconButtonProps as MuiIconButtonProps } from '@mui/material/IconButton';
import {
  FormContextType,
  getUiOptions,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  ...props
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F>({
    uiSchema,
    formContext: registry.formContext,
    options: uiOptions,
  });

  return (
    <IconButton
      title={translateString(TranslatableString.AddItemButton)}
      {...props}
      color='primary'
      {...(muiProps as MuiIconButtonProps)}
    >
      <AddIcon />
    </IconButton>
  );
}
