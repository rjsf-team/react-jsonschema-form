import React from 'react';

import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Slider from '@material-ui/core/Slider';
import FormLabel from '@material-ui/core/FormLabel';

import { rangeSpec } from 'react-jsonschema-form/lib/utils';
import { WidgetProps } from 'react-jsonschema-form';

const RangeWidget = ({
  value,
  readonly,
  disabled,
  onBlur,
  onFocus,
  options,
  schema,
  //formContext,
  //registry,
  //rawErrors,
  onChange,
  required,
  label,
  id,
}: WidgetProps) => {
  let sliderProps = { value, label, id, ...rangeSpec(schema) };

  const _onChange = ({}, value: any) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <Grid container={true} alignItems="flex-end">
      <FormControl
        fullWidth={true}
        //error={!!rawErrors}
        required={required}
      >
        <FormLabel id={id}>{label}</FormLabel>
        <Slider
          {...sliderProps}
          disabled={disabled || readonly}
          onChange={_onChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
        />
      </FormControl>
    </Grid>
  );
};

export default RangeWidget;
