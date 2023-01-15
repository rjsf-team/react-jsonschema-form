import React from "react";
import { FormControl, FormLabel } from "@chakra-ui/react";
import {
  ariaDescribedByIds,
  FormContextType,
  processSelectValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import { getChakra } from "../utils";
import { GroupBase, OptionsOrGroups, Select } from "chakra-react-select";

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
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

  const _onMultiChange = (e: any) => {
    return onChange(
      processSelectValue<T, S, F>(
        schema,
        e.map((v: { label: any; value: any }) => {
          return v.value;
        }),
        options
      )
    );
  };

  const _onChange = (e: any) => {
    return onChange(processSelectValue<T, S, F>(schema, e.value, options));
  };

  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, processSelectValue<T, S, F>(schema, value, options));

  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, processSelectValue<T, S, F>(schema, value, options));

  const _valueLabelMap: any = {};
  (enumOptions as any).map((option: any) => {
    const { value, label }: any = option;
    _valueLabelMap[value] = label;
    option["isDisabled"] =
      enumDisabled && (enumDisabled as any).indexOf(value) != -1;
  });

  const isMultiple = typeof multiple !== "undefined" && Boolean(enumOptions);
  const formValue: any = isMultiple
    ? (value || []).map((v: any) => {
        return {
          label: _valueLabelMap[v] || v,
          value: v,
        };
      })
    : {
        label: _valueLabelMap[value] || value || "",
        value: value || "",
      };
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
        <FormLabel htmlFor={isMultiple ? undefined : id}>
          {label || schema.title}
        </FormLabel>
      )}
      <Select
        inputId={id}
        name={id}
        isMulti={isMultiple}
        options={enumOptions as OptionsOrGroups<unknown, GroupBase<unknown>>}
        placeholder={placeholder}
        closeMenuOnSelect={!isMultiple}
        onBlur={_onBlur}
        onChange={isMultiple ? _onMultiChange : _onChange}
        onFocus={_onFocus}
        autoFocus={autofocus}
        value={formValue}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </FormControl>
  );
}
