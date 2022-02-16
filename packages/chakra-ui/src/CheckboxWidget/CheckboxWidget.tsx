import React from "react";
import { Checkbox, FormControl, Text } from "@chakra-ui/react";
import { WidgetProps } from "@rjsf/core";
import { getChakra } from "../utils";

const CheckboxWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    required,
    label,
    uiSchema,
  } = props;
  const chakraProps = getChakra({ uiSchema });

  const _onChange = ({
    target: { checked },
  }: React.ChangeEvent<HTMLInputElement>) => onChange(checked);
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement | any>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement | any>) => onFocus(id, value);

  return (
    <FormControl mb={1} {...chakraProps} isRequired={required}>
      <Checkbox
        id={id}
        name={id}
        isChecked={typeof value === "undefined" ? false : value}
        isDisabled={disabled || readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      >
        {label && <Text>{label}</Text>}
      </Checkbox>
    </FormControl>
  );
};

export default CheckboxWidget;
