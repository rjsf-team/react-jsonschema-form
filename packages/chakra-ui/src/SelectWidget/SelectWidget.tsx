import React from "react";
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
} from "@chakra-ui/react";
import { WidgetProps } from "@rjsf/core";
import { utils } from "@rjsf/core";
import { getChakra } from "../utils";

const { asNumber, guessType } = utils;

const nums = new Set(["number", "integer"]);

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema: any, value: any) => {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema;
  if (value === "") {
    return undefined;
  } else if (type === "array" && items && nums.has(items.type)) {
    return value.map(asNumber);
  } else if (type === "boolean") {
    return value === "true";
  } else if (type === "number") {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every((x: any) => guessType(x) === "number")) {
      return asNumber(value);
    } else if (schema.enum.every((x: any) => guessType(x) === "boolean")) {
      return value === "true";
    }
  }

  return value;
};

const SelectWidget = (props: WidgetProps) => {
  const {
    schema,
    id,
    options,
    label,
    placeholder,
    required,
    disabled,
    readonly,
    value,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    rawErrors = [],
    uiSchema,
  } = props;
  const { enumOptions, enumDisabled } = options;
  const chakraProps = getChakra({ uiSchema });

  // TODO: Default emptyValue should be string when multi select is implemented
  // const emptyValue = multiple ? [] : "";
  const emptyValue: string = "";

  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<{ name?: string; value: unknown }>) =>
    onChange(processValue(schema, value));
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLSelectElement>) =>
    onBlur(id, processValue(schema, value));
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLSelectElement>) =>
    onFocus(id, processValue(schema, value));

  return (
    <FormControl
      mb={1}
      {...chakraProps}
      isDisabled={disabled || readonly}
      isRequired={required}
      isReadOnly={readonly}
      isInvalid={rawErrors && rawErrors.length > 0}
    >
      {(label || schema.title) && (
        <FormLabel htmlFor={id}>{label || schema.title}</FormLabel>
      )}
      <Select
        id={id}
        placeholder={placeholder !== "" ? placeholder : " "}
        // value={
        //   typeof value === "undefined"
        //     ? emptyValue
        //     : typeof value === "string"
        //     ? value
        //     : value[0] || ""
        // }
        value={typeof value === "undefined" ? emptyValue : value}
        autoFocus={autofocus}
        onBlur={_onBlur}
        onChange={_onChange}
        onFocus={_onFocus}
      >
        {(enumOptions as any).map(({ value, label }: any, i: number) => {
          const disabled: any =
            enumDisabled && (enumDisabled as any).indexOf(value) != -1;
          return (
            <option key={i} value={value} disabled={disabled}>
              {label}
            </option>
          );
        })}
      </Select>
      {rawErrors && rawErrors.length > 0
        ? rawErrors.map((error, i) => (
            <FormErrorMessage key={i}>{error}</FormErrorMessage>
          ))
        : null}
    </FormControl>
  );
};

export default SelectWidget;
