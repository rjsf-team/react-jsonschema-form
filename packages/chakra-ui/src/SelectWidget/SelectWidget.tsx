import { FocusEvent, useMemo } from 'react';

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
import { Field } from '../components/ui/field';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from '../components/ui/select';
import { OptionsOrGroups } from 'chakra-react-select';
import { createListCollection, SelectValueChangeDetails } from '@chakra-ui/react';

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
  // const chakraProps = getChakra({ uiSchema });

  const _onMultiChange = (e: any) => {
    return onChange(
      enumOptionsValueForIndex<S>(
        e.map((v: { value: any }) => {
          return v.value;
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
  const formValue: any = isMultiple
    ? ((selectedIndex as string[]) || []).map((i: string) => {
        return {
          label: valueLabelMap[i],
          value: i,
        };
      })
    : [
        {
          label: valueLabelMap[selectedIndex as string] || '',
          selectedIndex,
        },
      ];

  const selectOptions = createListCollection({
    items: displayEnumOptions,
  });

  return (
    <Field
      mb={1}
      // {...chakraProps}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={rawErrors && rawErrors.length > 0}
      label={labelValue(label, hideLabel || !label)}
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
      >
        <SelectTrigger>
          <SelectValueText placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {selectOptions.items.map((item) => (
            <SelectItem item={item} key={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </Field>
  );
}
