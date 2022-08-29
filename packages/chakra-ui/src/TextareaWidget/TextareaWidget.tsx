import React from "react";
import { FormControl, FormLabel, Textarea } from "@chakra-ui/react";
import { WidgetProps } from "@rjsf/utils";
import { getChakra } from "../utils";

const TextareaWidget = ({
  id,
  placeholder,
  value,
  label,
  disabled,
  autofocus,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
  schema,
  uiSchema,
  required,
  rawErrors,
  registry,
}: WidgetProps) => {
  const chakraProps = getChakra({ uiSchema });
  const { schemaUtils } = registry;
  const displayLabel =
    schemaUtils.getDisplayLabel(schema, uiSchema) &&
    (!!label || !!schema.title);

  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLTextAreaElement>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLTextAreaElement>) => onFocus(id, value);

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
      <Textarea
        id={id}
        name={id}
        value={value ?? ""}
        placeholder={placeholder}
        autoFocus={autofocus}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </FormControl>
  );
};

export default TextareaWidget;
