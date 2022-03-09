import React from 'react';
import { WidgetProps } from '@rjsf/core';

import { useMuiComponent } from '../MuiComponentContext';

const UpDownWidget = ({
  id,
  required,
  readonly,
  disabled,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
}: WidgetProps) => {
  const { FormControl, InputLabel, Input } = useMuiComponent();
  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => onChange(value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <FormControl fullWidth={true} required={required}>
      <InputLabel>{label}</InputLabel>
      <Input
        id={id}
        autoFocus={autofocus}
        required={required}
        type="number"
        disabled={disabled || readonly}
        value={value || value === 0 ? value : ''}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </FormControl>
  );
};

export default UpDownWidget;
