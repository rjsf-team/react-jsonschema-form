import React from "react";
import {
  CheckboxGroup,
  Checkbox,
  FormLabel,
  FormControl,
  Text,
  Stack,
} from "@chakra-ui/react";
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import { getChakra } from "../utils";

export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    disabled,
    options,
    value,
    readonly,
    onChange,
    onBlur,
    onFocus,
    required,
    label,
    uiSchema,
    rawErrors = [],
    schema,
  } = props;
  const { enumOptions, enumDisabled } = options;
  const chakraProps = getChakra({ uiSchema });

  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement | any>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement | any>) => onFocus(id, value);

  const row = options ? options.inline : false;

  return (
    <FormControl
      mb={1}
      {...chakraProps}
      isDisabled={disabled || readonly}
      isRequired={required}
      isReadOnly={readonly}
      isInvalid={rawErrors && rawErrors.length > 0}
    >
      <FormLabel htmlFor={id} id={`${id}-label`}>
        {label || schema.title}
      </FormLabel>
      <CheckboxGroup
        onChange={(option) => onChange(option)}
        defaultValue={value}
      >
        <Stack direction={row ? "row" : "column"}>
          {Array.isArray(enumOptions) &&
            enumOptions.map((option) => {
              const checked = value.indexOf(option.value) !== -1;
              const itemDisabled =
                Array.isArray(enumDisabled) &&
                enumDisabled.indexOf(option.value) !== -1;
              return (
                <Checkbox
                  key={option.value}
                  id={`${id}-${option.value}`}
                  name={id}
                  value={option.value}
                  isChecked={checked}
                  isDisabled={disabled || itemDisabled || readonly}
                  onBlur={_onBlur}
                  onFocus={_onFocus}
                >
                  {option.label && <Text>{option.label}</Text>}
                </Checkbox>
              );
            })}
        </Stack>
      </CheckboxGroup>
    </FormControl>
  );
}
