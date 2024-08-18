import { FocusEvent, useMemo } from 'react';
import { FormControl, FormLabel } from '@chakra-ui/react';
import {
  ariaDescribedByIds,
  EnumOptionsType,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { getChakra } from '../utils';
import { OptionsOrGroups, Select } from 'chakra-react-select';

export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    id,
    options,
    label,
    hideLabel,
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
    schema,
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
    return onChange(enumOptionsValueForIndex<S>(e.value, enumOptions, emptyValue));
  };

  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));

  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));

  const showPlaceholderOption = !multiple && schema.default === undefined;
  const { valueLabelMap, displayEnumOptions } = useMemo((): {
    valueLabelMap: Record<string | number, string>;
    displayEnumOptions: OptionsOrGroups<any, any>;
  } => {
    const valueLabelMap: Record<string | number, string> = {};
    let displayEnumOptions: OptionsOrGroups<any, any> = [];
    if (Array.isArray(enumOptions)) {
      displayEnumOptions = enumOptions.map((option: EnumOptionsType<S>, index: number) => {
        const { value, label } = option;
        valueLabelMap[index] = label || String(value);
        return {
          label,
          value: String(index),
          isDisabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
        };
      });
      if (showPlaceholderOption) {
        (displayEnumOptions as any[]).unshift({ value: '', label: placeholder || '' });
      }
    }
    return { valueLabelMap: valueLabelMap, displayEnumOptions: displayEnumOptions };
  }, [enumDisabled, enumOptions, placeholder, showPlaceholderOption]);

  const isMultiple = typeof multiple !== 'undefined' && multiple !== false && Boolean(enumOptions);
  const selectedIndex = enumOptionsIndexForValue<S>(value, enumOptions, isMultiple);
  const formValue: any = isMultiple
    ? ((selectedIndex as string[]) || []).map((i: string) => {
        return {
          label: valueLabelMap[i],
          value: i,
        };
      })
    : {
        label: valueLabelMap[selectedIndex as string] || '',
        selectedIndex,
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
      {labelValue(
        <FormLabel htmlFor={id} id={`${id}-label`}>
          {label}
        </FormLabel>,
        hideLabel || !label
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
