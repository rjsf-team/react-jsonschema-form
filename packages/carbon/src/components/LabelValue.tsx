import { ReactNode } from 'react';
import { CarbonOptionsContextType, useCarbonOptions } from '../contexts';

/** Get the mark for the label, marking it as required or optional
 *
 * @param required - Whether the field is required
 * @param labelMark - The label mark type
 * @returns
 */
function getMark(required: boolean, labelMark: CarbonOptionsContextType['labelMark']): ReactNode {
  if (required && labelMark === 'required') {
    return ' (required)';
  }
  if (required && labelMark === 'optional') {
    return ' (optional)';
  }
  return null;
}

/** The `LabelValue` render a label conditionally and append a required or optional mark
 */
export function LabelValue({
  hide = false,
  required = false,
  label,
}: {
  label: ReactNode;
  hide?: boolean;
  required?: boolean;
}) {
  const carbonOptions = useCarbonOptions();
  if (hide) {
    return null;
  }
  const mark = getMark(required, carbonOptions.labelMark);
  return (
    <>
      {label}
      {mark}
    </>
  );
}
