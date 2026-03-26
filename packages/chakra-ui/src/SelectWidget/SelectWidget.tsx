import { FocusEvent, useMemo, useRef } from 'react';

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
import { OptionsOrGroups } from 'chakra-react-select';
import { createListCollection, SelectValueChangeDetails, Select as ChakraSelect } from '@chakra-ui/react';

import { Field } from '../components/ui/field';
import { SelectRoot, SelectTrigger, SelectValueText } from '../components/ui/select';
import { getChakra } from '../utils';

export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const {
    id,
    htmlName,
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
    schema,
    uiSchema,
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const useRealValues = !!htmlName;

  const _onMultiChange = ({ value }: SelectValueChangeDetails) => {
    if (useRealValues) {
      return onChange(value);
    }
    return onChange(enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  };

  const _onSingleChange = ({ value }: SelectValueChangeDetails) => {
    if (useRealValues) {
      const selected = Array.isArray(value) && value.length === 1 ? value[0] : value;
      return onChange(selected || emptyValue);
    }
    const selected = enumOptionsValueForIndex<S>(value, enumOptions, emptyValue);
    return onChange(Array.isArray(selected) && selected.length === 1 ? selected[0] : selected);
  };

  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(
      id,
      useRealValues
        ? target && target.value
        : enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue),
    );

  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(
      id,
      useRealValues
        ? target && target.value
        : enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue),
    );

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
        const optionKey = useRealValues ? String(value) : index;
        valueLabelMap[optionKey] = label || String(value);
        return {
          label,
          value: useRealValues ? String(value) : String(index),
          disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
        };
      });
      if (showPlaceholderOption) {
        (displayEnumOptions as any[]).unshift({ value: '', label: placeholder || '' });
      }
    }
    return { valueLabelMap: valueLabelMap, displayEnumOptions: displayEnumOptions };
  }, [enumDisabled, enumOptions, placeholder, showPlaceholderOption, useRealValues]);

  const isMultiple = typeof multiple !== 'undefined' && multiple !== false && Boolean(enumOptions);
  const selectedIndex = enumOptionsIndexForValue<S>(value, enumOptions, isMultiple);

  const getMultiValue = () =>
    ((selectedIndex as string[]) || []).map((i: string) => {
      const key = useRealValues ? String(value[Number(i)]) : i;
      return {
        label: valueLabelMap[useRealValues ? key : i],
        value: useRealValues ? key : i.toString(),
      };
    });

  const getSingleValue = () =>
    typeof selectedIndex !== 'undefined'
      ? [
          {
            label: valueLabelMap[useRealValues ? String(value) : (selectedIndex as string)] || '',
            value: useRealValues ? String(value) : selectedIndex.toString(),
          },
        ]
      : [];

  const formValue = useRealValues
    ? typeof value !== 'undefined'
      ? Array.isArray(value)
        ? value.map(String)
        : [String(value)]
      : []
    : (isMultiple ? getMultiValue() : getSingleValue()).map((item) => item.value);

  const selectOptions = createListCollection({
    items: displayEnumOptions.filter((item) => item.value),
  });

  const containerRef = useRef(null);
  const chakraProps = getChakra({ uiSchema });

  return (
    <Field
      ref={containerRef}
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={rawErrors && rawErrors.length > 0}
      label={labelValue(label, hideLabel || !label)}
      position='relative'
      {...chakraProps}
    >
      <SelectRoot
        collection={selectOptions}
        id={id}
        name={htmlName || id}
        multiple={isMultiple}
        closeOnSelect={!isMultiple}
        onBlur={_onBlur}
        onValueChange={isMultiple ? _onMultiChange : _onSingleChange}
        onFocus={_onFocus}
        autoFocus={autofocus}
        value={formValue}
        aria-describedby={ariaDescribedByIds(id)}
        positioning={{ placement: 'bottom' }}
      >
        <ChakraSelect.Control>
          <SelectTrigger>
            <SelectValueText placeholder={placeholder} />
          </SelectTrigger>
        </ChakraSelect.Control>
        <ChakraSelect.Positioner minWidth='100% !important' zIndex='2 !important' top='calc(100% + 5px) !important'>
          <ChakraSelect.Content>
            {selectOptions.items.map((item) => (
              <ChakraSelect.Item item={item} key={item.value}>
                {item.label}
                <ChakraSelect.ItemIndicator />
              </ChakraSelect.Item>
            ))}
          </ChakraSelect.Content>
        </ChakraSelect.Positioner>
      </SelectRoot>
    </Field>
  );
}
