import React from 'react';

import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';

import { WidgetProps } from 'react-jsonschema-form';

const RadioWidget = ({
  id,
  schema,
  options,
  value,
  required,
  disabled,
  readonly,
  label,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) => {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  const { enumOptions, enumDisabled } = options;

  const _onChange = ({}, value: any) =>
    onChange(schema.type == 'boolean' ? value !== 'false' : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const row = options ? options.inline : false;

  return (
    <FormControl fullWidth={true} required={required}>
      <FormLabel htmlFor={id}>{label || schema.title}</FormLabel>
      <RadioGroup
        name={name}
        value={`${value}`}
        row={row as boolean}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      >
        {(enumOptions as any).map((option: any, i: number) => {
          const itemDisabled =
            enumDisabled && (enumDisabled as any).indexOf(option.value) != -1;

          const radio = (
            <FormControlLabel
              control={<Radio color="primary" key={i} />}
              label={`${option.label}`}
              value={`${option.value}`}
              key={i}
              disabled={disabled || itemDisabled || readonly}
            />
          );

          return radio;
        })}
      </RadioGroup>
    </FormControl>
  );
};

export default RadioWidget;
