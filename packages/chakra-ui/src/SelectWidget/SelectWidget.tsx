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

export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
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
    schema,
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onMultiChange = ({ value }: SelectValueChangeDetails) => {
    return onChange(
      enumOptionsValueForIndex<S>(
        value.map((item) => {
          return item;
        }),
        enumOptions,
        emptyValue,
      ),
    );
  };

  const _onChange = ({ value }: SelectValueChangeDetails) => {
    return onChange(enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
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
          disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
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

  const getMultiValue = () =>
    ((selectedIndex as string[]) || []).map((i: string) => {
      return {
        label: valueLabelMap[i],
        value: i.toString(),
      };
    });

  const getSingleValue = () =>
    typeof selectedIndex !== 'undefined'
      ? [
          {
            label: valueLabelMap[selectedIndex as string] || '',
            value: selectedIndex.toString(),
          },
        ]
      : [];

  const formValue = (isMultiple ? getMultiValue() : getSingleValue()).map((item) => item.value);

  const selectOptions = createListCollection({
    items: displayEnumOptions.filter((item) => item.value),
  });

  const containerRef = useRef(null);

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
    >
      <SelectRoot
        collection={selectOptions}
        id={id}
        name={id}
        multiple={isMultiple}
        closeOnSelect={!isMultiple}
        onBlur={_onBlur}
        onValueChange={isMultiple ? _onMultiChange : _onChange}
        onFocus={_onFocus}
        autoFocus={autofocus}
        value={formValue}
        aria-describedby={ariaDescribedByIds<T>(id)}
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
