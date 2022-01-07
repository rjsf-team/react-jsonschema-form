import * as React from "react";

import {
  FormControl,
  FormLabel,
  // FormHelperText,
  // FormErrorMessage,
  Input,
} from "@chakra-ui/react";

import { WidgetProps, utils } from "@rjsf/core";

const { getDisplayLabel } = utils;

export type TextWidgetProps = WidgetProps & {};

const TextWidget = (props: TextWidgetProps) => {
  const {
    id,
    type,
    value,
    label,
    schema,
    uiSchema,
    onChange,
    onBlur,
    onFocus,
    options,
    required,
    readonly,
    rawErrors,
    autofocus,
    placeholder,
    disabled,
  } = props;

  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const displayLabel = getDisplayLabel(schema, uiSchema);
  // const inputType =
  //   (type || schema.type) === "string" ? "text" : `${type || schema.type}`;

  return (
    <FormControl
      isDisabled={disabled || readonly}
      isRequired={required}
      isReadOnly={readonly}
      isInvalid={rawErrors?.length > 0}>
      {displayLabel ? (
        <FormLabel htmlFor={id}>{label || schema.title}</FormLabel>
      ) : null}
      <Input
        id={id}
        value={value || value === 0 ? value : ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        autoFocus={autofocus}
        placeholder={placeholder}
        // type={inputType}
        type={type}
      />
      {/* {rawErrors?.length > 0
          ? rawErrors.map((error, i) => (
              <FormErrorMessage key={i}>{error}</FormErrorMessage>
            ))
          : null} */}
    </FormControl>
  );
};

export default TextWidget;
