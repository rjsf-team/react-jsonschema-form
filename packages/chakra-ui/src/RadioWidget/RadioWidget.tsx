import React from "react";

import {
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
} from "@chakra-ui/react";

import { WidgetProps } from "@rjsf/utils";
import { getChakra } from "../utils";

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
  uiSchema,
}: WidgetProps) => {
  const { enumOptions, enumDisabled } = options;
  const chakraProps = getChakra({ uiSchema });

  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const row = options ? options.inline : false;

  return (
    <FormControl
      mb={1}
      {...chakraProps}
      isDisabled={disabled || readonly}
      isRequired={required}
      isReadOnly={readonly}
    >
      <FormLabel htmlFor={id}>{label || schema.title}</FormLabel>
      <RadioGroup
        onChange={onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        value={`${value}`}
        name={id}
      >
        <Stack direction={row ? "row" : "column"}>
          {(enumOptions as any).map((option: any, i: number) => {
            const itemDisabled = Boolean(
              enumDisabled && (enumDisabled as any).indexOf(option.value) != -1
            );

            return (
              <Radio
                value={`${option.value}`}
                key={i}
                disabled={disabled || itemDisabled || readonly}
              >
                {`${option.label}`}
              </Radio>
            );
          })}
        </Stack>
      </RadioGroup>
    </FormControl>
  );
};

export default RadioWidget;
