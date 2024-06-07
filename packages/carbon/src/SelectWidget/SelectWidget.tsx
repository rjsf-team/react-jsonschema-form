import { ChangeEvent, FocusEvent, SyntheticEvent, useMemo } from 'react';
import {
  ariaDescribedByIds,
  EnumOptionsType,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  getUiOptions,
} from '@rjsf/utils';
import { Select, SelectItem, MultiSelect } from '@carbon/react';
import { LabelValue } from '../components/LabelValue';
import getCarbonOptions, { maxLgSize } from '../utils';

/** Implement `SelectWidget`
 */
export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    schema,
    id,
    options,
    label,
    hideLabel,
    placeholder,
    multiple = false,
    required,
    disabled,
    readonly,
    value,
    autofocus = false,
    onChange,
    onBlur,
    onFocus,
    rawErrors = [],
    formContext,
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const uiOptions = getUiOptions<T, S, F>(props.uiSchema);
  const carbonOptions = getCarbonOptions<T, S, F>(props.registry.formContext, uiOptions);

  const _onFocus = (event: FocusEvent<HTMLSelectElement>) => {
    const newValue = getValue(event, multiple);
    return onFocus(id, enumOptionsValueForIndex<S>(newValue, enumOptions, emptyValue));
  };

  const _onBlur = (event: FocusEvent<HTMLSelectElement>) => {
    const newValue = getValue(event, multiple);
    return onBlur(id, enumOptionsValueForIndex<S>(newValue, enumOptions, emptyValue));
  };

  const _onMultipleChange = ({ selectedItems }: { selectedItems: any[] }) => {
    console.log('_onMultipleChange', selectedItems);
    return onChange(
      enumOptionsValueForIndex<S>(
        selectedItems.map((item) => item.value),
        enumOptions,
        emptyValue
      )
    );
  };

  const _onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    return onChange(enumOptionsValueForIndex<S>(event.target.value, enumOptions, emptyValue));
  };

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  const displayEnumOptions = useMemo(
    () =>
      Array.isArray(enumOptions)
        ? enumOptions.map((option: EnumOptionsType<S>, index: number) => {
            const { value, label } = option;
            return {
              label,
              id: String(index),
              value: String(index),
              disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
            };
          })
        : [],
    [enumOptions, enumDisabled]
  );

  // window environment for `downshift`
  const environment = formContext?.carbon?.environment || window;

  if (multiple) {
    return (
      <MultiSelect
        label={<LabelValue label={label} hide={hideLabel || !label} required={required} />}
        id={id}
        hideLabel
        onChange={_onMultipleChange}
        selectedItems={
          typeof selectedIndexes === 'undefined'
            ? []
            : displayEnumOptions.filter((item) => selectedIndexes.includes(item.value))
        }
        aria-describedby={ariaDescribedByIds<T>(id)}
        invalid={rawErrors && rawErrors.length > 0}
        disabled={disabled || readonly}
        readOnly={readonly}
        items={displayEnumOptions}
        downshiftProps={{
          environment,
        }}
        selectionFeedback='fixed'
        size={carbonOptions.size === 'xl' ? 'lg' : carbonOptions.size}
      />
    );
  }

  return (
    <Select
      id={id}
      hideLabel
      labelText={<LabelValue label={label} hide={hideLabel || !label} required={required} />}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      autoFocus={autofocus}
      value={typeof selectedIndexes === 'undefined' ? '' : selectedIndexes}
      aria-describedby={ariaDescribedByIds<T>(id)}
      invalid={rawErrors && rawErrors.length > 0}
      disabled={disabled || readonly}
      readOnly={readonly}
      size={maxLgSize(carbonOptions.size)}
    >
      {!multiple && schema.default === undefined && <SelectItem value='' text={placeholder ?? ''} />}
      {displayEnumOptions.map((item) => (
        <SelectItem key={item.value} value={item.value} text={item.label} disabled={item.disabled} />
      ))}
    </Select>
  );
}

function getValue(event: SyntheticEvent<HTMLSelectElement>, multiple: boolean) {
  if (multiple) {
    return Array.from((event.target as HTMLSelectElement).options)
      .slice()
      .filter((o) => o.selected)
      .map((o) => o.value);
  }
  return (event.target as HTMLSelectElement).value;
}
