import { ReactNode } from 'react';

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
  if (hide) {
    return null;
  }
  return (
    <>
      {label}
      {required && <span>{' (required)'}</span>}
    </>
  );
}
