import React from "react";
import { FormControl, FormLabel } from "@chakra-ui/react";
import {
  ariaDescribedByIds,
  EnumOptionsType,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import { getChakra } from "../utils";
import { OptionsOrGroups, Select } from "chakra-react-select";

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
  const { enumOptions, enumDisabled, emptyValue } = options;
  const chakraProps = getChakra({ uiSchema });

  const _onMultiChange = (e: any) => {
    return onChange(
      enumOptionsValueForIndex<S>(
        e.map((v: { value: any }) => {
          return v.value;
        }),
        enumOptions,
        emptyValue
      )
    );
  };

  const _onChange = (e: any) => {
    return onChange(
      enumOptionsValueForIndex<S>(e.value, enumOptions, emptyValue)
    );
  };

  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  const _valueLabelMap: any = {};
  const displayEnumOptions: OptionsOrGroups<any, any> = Array.isArray(
    enumOptions
  )
    ? enumOptions.map((option: EnumOptionsType<S>, index: number) => {
        const { value, label } = option;
        _valueLabelMap[index] = label;
        return {
          label,
          value: String(index),
          isDisabled:
            Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
        };
      })
    : [];

  const isMultiple = typeof multiple !== "undefined" && Boolean(enumOptions);
  const formValue: any = isMultiple
    ? (value || []).map((v: any, index: number) => {
        return {
          label: _valueLabelMap[index] || v,
          value: index,
        };
      })
    : {
        label: _valueLabelMap[0] || value || "",
        value: 0,
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
        options={displayEnumOptions}
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
