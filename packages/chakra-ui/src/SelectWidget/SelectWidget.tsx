import React from "react";
import { FormControl, FormLabel } from "@chakra-ui/react";
import { processSelectValue, WidgetProps } from "@rjsf/utils";
import { getChakra } from "../utils";
import { GroupBase, OptionsOrGroups, Select } from "chakra-react-select";

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
    onChange,
    rawErrors = [],
    uiSchema,
  } = props;
  const { enumOptions } = options;
  const chakraProps = getChakra({ uiSchema });

  /// TODO: Figure if we need an empty value at all

  const _onMultiChange = (e: any) => {
    return onChange(
      processSelectValue(
        schema,
        e.map((v: { label: any; value: any }) => {
          return v.value;
        }),
        options
      )
    );
  };

  const _onChange = (e: any) => {
    return onChange(processSelectValue(schema, e.value, options));
  };

  const _valueLabelMap: any = {};

  (enumOptions as any).map(({ value, label }: any) => {
    _valueLabelMap[value] = label;
  });

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
        <Select
          inputId={id}
          name={id}
          isMulti
          options={enumOptions as OptionsOrGroups<unknown, GroupBase<unknown>>}
          placeholder={placeholder}
          closeMenuOnSelect={false}
          onChange={_onMultiChange}
          value={value.map((v: any) => {
            return {
              label: _valueLabelMap[v],
              value: v,
            };
          })}
        />
      ) : (
        <Select
          inputId={id}
          name={id}
          options={enumOptions as OptionsOrGroups<unknown, GroupBase<unknown>>}
          placeholder={placeholder}
          closeMenuOnSelect={true}
          onChange={_onChange}
        />
      )}
    </FormControl>
  );
};

export default SelectWidget;
