import * as React from "react";
import { FormControl, FormLabel, Input } from "@chakra-ui/react";
import { WidgetProps, utils } from "@rjsf/core";
import { getChakra } from "../utils";

const { getDisplayLabel } = utils;

const TextWidget = (props: WidgetProps) => {
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
  const chakraProps = getChakra({ uiSchema });
  console.log("TextWidget props", props);
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const displayLabel =
    getDisplayLabel(schema, uiSchema) && (!!label || !!schema.title);

  const inputType =
    (type || schema.type) === "string" ? "text" : `${type || schema.type}`;

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
        <FormLabel htmlFor={id} id={`${id}-label`}>
          {label || schema.title}
        </FormLabel>
      ) : null}
      <Input
        id={id}
        value={value || value === 0 ? value : ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        autoFocus={autofocus}
        placeholder={placeholder}
        type={inputType}
        list={schema.examples ? `examples_${id}` : undefined}
      />
      {schema.examples ? (
        <datalist id={`examples_${id}`}>
          {(schema.examples as string[])
            .concat(schema.default ? ([schema.default] as string[]) : [])
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      ) : null}
    </FormControl>
  );
};

export default TextWidget;
