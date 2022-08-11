import * as React from "react";
import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { processSelectValue, WidgetProps } from "@rjsf/utils";
import { getChakra } from "../utils";
import {
  GroupBase,
  OptionsOrGroups,
  Select as ChakraMultiSelect,
} from "chakra-react-select";

const SelectWidget = (props: WidgetProps) => {
  const {
    schema,
    id,
    options,
    label,
    placeholder,
    multiple,
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
  const emptyValue = "";

  const _onMultiChange = (e: any) => {
    return onChange(
      processSelectValue(
        schema,
        e.map((v: { label: any; value: any }) => {
          return v.value;
        })
      )
    );
  };

  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<{ name?: string; value: unknown }>) =>
    onChange(processSelectValue(schema, value));
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLSelectElement>) =>
    onBlur(id, processSelectValue(schema, value));
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLSelectElement>) =>
    onFocus(id, processSelectValue(schema, value));

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
        <FormLabel
          htmlFor={
            typeof multiple !== "undefined" && enumOptions ? undefined : id
          }
        >
          {label || schema.title}
        </FormLabel>
      )}
      {typeof multiple !== "undefined" && enumOptions ? (
        <ChakraMultiSelect
          inputId={id}
          name={id}
          isMulti
          options={enumOptions as OptionsOrGroups<unknown, GroupBase<unknown>>}
          placeholder={placeholder}
          closeMenuOnSelect={false}
          onChange={_onMultiChange}
          value={value.map((v: any) => {
            return {
              label: v,
              value: v,
            };
          })}
        />
      ) : (
        <Select
          id={id}
          name={id}
          placeholder={placeholder !== "" ? placeholder : " "}
          value={typeof value === "undefined" ? emptyValue : value.toString()}
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
      )}
    </FormControl>
  );
};

export default SelectWidget;
