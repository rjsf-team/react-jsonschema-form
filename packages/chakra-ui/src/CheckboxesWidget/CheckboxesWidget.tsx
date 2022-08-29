import React from "react";
import {
  CheckboxGroup,
  Checkbox,
  FormLabel,
  FormControl,
  Text,
  Stack,
} from "@chakra-ui/react";
import { WidgetProps } from "@rjsf/utils";
import { getChakra } from "../utils";

// const selectValue = (value, selected, all) => {
//   const at = all.indexOf(value);
//   const updated = selected.slice(0, at).concat(value, selected.slice(at));

//   // As inserting values at predefined index positions doesn't work with empty
//   // arrays, we need to reorder the updated selection to match the initial order
//   return updated.sort((a, b) => all.indexOf(a) > all.indexOf(b));
// };

// const deselectValue = (value, selected) => {
//   return selected.filter((v) => v !== value);
// };

const CheckboxesWidget = (props: WidgetProps) => {
  const {
    id,
    disabled,
    options,
    value,
    readonly,
    onChange,
    onBlur,
    onFocus,
    required,
    label,
    uiSchema,
    rawErrors = [],
    schema,
  } = props;
  const { enumOptions, enumDisabled } = options;
  const chakraProps = getChakra({ uiSchema });
  // const _onChange = option => ({ target: { checked } }) => {
  //   const all = enumOptions.map(({ value }) => value)

  //   if (checked) {
  //     onChange(selectValue(option.value, value, all))
  //   } else {
  //     onChange(deselectValue(option.value, value))
  //   }
  // }

  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement | any>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement | any>) => onFocus(id, value);

  const row = options ? options.inline : false;

  return (
    <FormControl
      mb={1}
      {...chakraProps}
      isDisabled={disabled || readonly}
      isRequired={required}
      isReadOnly={readonly}
      isInvalid={rawErrors && rawErrors.length > 0}
    >
      <FormLabel htmlFor={id} id={`${id}-label`}>
        {label || schema.title}
      </FormLabel>
      <CheckboxGroup
        onChange={(option) => onChange(option)}
        defaultValue={value}
      >
        <Stack direction={row ? "row" : "column"}>
          {(enumOptions as any).map(
            (option: { value: any; label: any }, index: any) => {
              const checked = value.indexOf(option.value) !== -1;
              const itemDisabled =
                enumDisabled &&
                (enumDisabled as string[]).indexOf(option.value) !== -1;
              return (
                <Checkbox
                  key={`${id}_${index}`}
                  id={`${id}_${index}`}
                  value={option.value}
                  isChecked={checked}
                  isDisabled={disabled || itemDisabled || readonly}
                  onBlur={_onBlur}
                  onFocus={_onFocus}
                >
                  {option.label && <Text>{option.label}</Text>}
                </Checkbox>
              );
            }
          )}
        </Stack>
      </CheckboxGroup>
    </FormControl>
  );
};

export default CheckboxesWidget;
