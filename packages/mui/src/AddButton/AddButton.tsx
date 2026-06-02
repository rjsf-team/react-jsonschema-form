import AddIcon from '@mui/icons-material/Add';
import type { IconButtonProps as MuiIconButtonProps } from '@mui/material/IconButton';
import IconButton from '@mui/material/IconButton';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getUiOptions, TranslatableString } from '@rjsf/utils';

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
  const muiProps = getMuiProps<T, S, F, MuiIconButtonProps>(uiOptions, [
    'color',
    'disableFocusRipple',
    'disableRipple',
    'edge',
    'size',
    'sx',
  ]);

  return (
    <IconButton title={translateString(TranslatableString.AddItemButton)} {...props} color='primary' {...muiProps}>
      <AddIcon />
    </IconButton>
  );
}
