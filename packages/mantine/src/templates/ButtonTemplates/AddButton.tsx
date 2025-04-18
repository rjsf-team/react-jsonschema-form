import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

import IconButton from './IconButton';
import { Plus } from '../icons';

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.CopyButton)} variant='subtle' {...props} icon={<Plus />} />
  );
}
