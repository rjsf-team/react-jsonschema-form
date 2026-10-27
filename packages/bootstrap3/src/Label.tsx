import { memo } from 'react';

const REQUIRED_FIELD_SYMBOL = '*';

export interface LabelProps {
  /** The label for the field */
  label?: string;
  /** A boolean value stating if the field is required */
  required?: boolean;
  /** The id of the input field being labeled */
  id?: string;
  /** The class names of the `<label>` */
  className?: string;
}

/** Renders a label for a field; the control its `for` names is named by the whole label, required marker included
 *
 * @param props - The `LabelProps` for this component
 */
function Label(props: LabelProps) {
  const { label, required, id, className } = props;
  if (!label) {
    return null;
  }
  return (
    <label className={className} htmlFor={id}>
      {label}
      {required && <span className='rjsf-required'>{REQUIRED_FIELD_SYMBOL}</span>}
    </label>
  );
}
// Memoized so a keystroke in its own field is not a render of its label. A keystroke in another field renders neither:
// `SchemaField` is what keeps the fields apart, not this
export default memo(Label);
