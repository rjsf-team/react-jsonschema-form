import { ReactNode } from 'react';
import { CarbonOptionsContextType, useCarbonOptions } from '../contexts';

function getMark(required: boolean, labelMark: CarbonOptionsContextType['labelMark']) {
  if (required && labelMark === 'required') {
    return ' (required)';
  }
  if (required && labelMark === 'optional') {
    return ' (optional)';
  }
  return null;
}

export function ConditionLabel({ hide, required, label }: { label: ReactNode; hide?: boolean; required?: boolean }) {
  const carbonOptions = useCarbonOptions();
  if (hide) {
    return null;
  }
  const mark = getMark(required ?? false, carbonOptions.labelMark);
  return (
    <>
      {label}
      {mark}
    </>
  );
}
