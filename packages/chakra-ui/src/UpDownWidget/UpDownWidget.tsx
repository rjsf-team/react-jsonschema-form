import React from "react";
import {
  NumberInput,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { WidgetProps } from "@rjsf/utils";
import { getChakra } from "../utils";

const UpDownWidget = (props: WidgetProps) => {
  const {
    id,
    schema,
    uiSchema,
    readonly,
    disabled,
    label,
    value,
    onChange,
    onBlur,
    onFocus,
    rawErrors,
    required,
    registry,
  } = props;

  const { schemaUtils } = registry;
  const displayLabel =
    schemaUtils.getDisplayLabel(schema, uiSchema) &&
    (!!label || !!schema.title);

  const chakraProps = getChakra({ uiSchema });

  const _onChange = (value: string | number) => onChange(value);
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement | any>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement | any>) => onFocus(id, value);

  return (
    <FormControl
      mb={1}
      {...chakraProps}
      isDisabled={disabled || readonly}
      isRequired={required}
      isReadOnly={readonly}
      isInvalid={rawErrors && rawErrors.length > 0}
    >
      {displayLabel ? (
        <FormLabel htmlFor={id}>{label || schema.title}</FormLabel>
      ) : null}
      <NumberInput
        value={value ?? ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      >
        <NumberInputField id={id} name={id} />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </FormControl>
  );
};

export default UpDownWidget;
