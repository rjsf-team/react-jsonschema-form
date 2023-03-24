import { Label } from '@fluentui/react';

export const styles_red = {
  // TODO: get this color from theme.
  color: 'rgb(164, 38, 44)',
  fontSize: 12,
  fontWeight: 'normal' as any,
  fontFamily: `"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif`,
};

interface FluentLabelProps {
  label?: string;
  required?: boolean;
  id?: string;
}

export default function FluentLabel({ label, required, id }: FluentLabelProps) {
  return (
    <Label htmlFor={id}>
      {label}
      {required && <span style={styles_red}>&nbsp;*</span>}
    </Label>
  );
}
