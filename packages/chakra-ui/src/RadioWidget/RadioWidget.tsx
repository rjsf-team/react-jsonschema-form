import React from "react";
import {
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
} from "@chakra-ui/react";
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import { getChakra } from "../utils";

export default function RadioWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
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
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;
  const chakraProps = getChakra({ uiSchema });

  const _onChange = (nextValue: any) =>
    onChange(enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  const row = options ? options.inline : false;
  const selectedIndex = enumOptionsIndexForValue<S>(
    value,
    enumOptions
  ) as string;

  return (
    <FormControl
      mb={1}
      {...chakraProps}
      isDisabled={disabled || readonly}
      isRequired={required}
      isReadOnly={readonly}
    >
      <FormLabel htmlFor={id} id={`${id}-label`}>
        {label || schema.title}
      </FormLabel>
      <RadioGroup
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        value={selectedIndex}
        name={id}
        aria-describedby={ariaDescribedByIds<T>(id)}
      >
        <Stack direction={row ? "row" : "column"}>
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              const itemDisabled =
                Array.isArray(enumDisabled) &&
                enumDisabled.indexOf(option.value) !== -1;

              return (
                <Radio
                  value={String(index)}
                  key={index}
                  id={optionId(id, index)}
                  disabled={disabled || itemDisabled || readonly}
                >
                  {option.label}
                </Radio>
              );
            })}
        </Stack>
      </RadioGroup>
    </FormControl>
  );
}
