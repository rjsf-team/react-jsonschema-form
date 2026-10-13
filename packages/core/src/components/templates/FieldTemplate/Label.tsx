import { memo } from 'react';

const REQUIRED_FIELD_SYMBOL = '*';

export interface LabelProps {
  /** The label for the field */
  label?: string;
  /** A boolean value stating if the field is required */
  required?: boolean;
  /** The id of the input field being labeled */
  id?: string;
}

/** Renders a label for a field
 *
 * @param props - The `LabelProps` for this component
 */
function Label(props: LabelProps) {
  const { label, required, id } = props;
  if (!label) {
    return null;
  }
  return (
    <label className='control-label' htmlFor={id}>
      {label}
      {required && <span className='required'>{REQUIRED_FIELD_SYMBOL}</span>}
    </label>
  );
}
// Memoized so a keystroke in the field, or in another, is not a render of its label
export default memo(Label);
