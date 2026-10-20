import type { FormContextType, WidgetProps, RJSFSchema, StrictRJSFSchema, GenericObjectType } from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionsAutofocusIndex,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  getGroupAttributes,
  getOptionValueFormat,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';
import { Checkbox } from 'antd';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  autofocus,
  disabled,
  registry,
  id,
  htmlName,
  onBlur,
  onChange,
  onFocus,
  options,
  readonly,
  value,
  presentation,
}: WidgetProps<T, S, F>) {
  const { formContext } = registry;
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;
  const fieldDisabled = disabled || (readonlyAsDisabled && readonly);

  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleChange = (nextValue: string[]) =>
    onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  // Antd's typescript definitions for `Checkbox.Group` do not contain `id`, which it does use when provided, so it is
  // spread on via `extraProps` to avoid a typescript error
  const extraProps = { id };

  const selectValue: string[] = enumOptionSelectedValue(value, enumOptions, true, optionValueFormat, []);
  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'group',
  );

  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus);
  return Array.isArray(enumOptions) && enumOptions.length > 0 ? (
    <Checkbox.Group
      name={htmlName || id}
      onChange={!readonly ? handleChange : undefined}
      value={selectValue}
      {...extraProps}
      {...groupAttributes}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, i) => (
          // oxlint-disable-next-line react/no-array-index-key
          <span key={i}>
            <Checkbox
              id={optionId(id, i)}
              name={htmlName || id}
              autoFocus={i === autofocusIndex}
              // `undefined` rather than `false` for an enabled option, since antd reads its `DisabledContext` only when
              // the checkbox leaves `disabled` unset
              disabled={fieldDisabled || enumOptionsIsDisabled(option.value, enumDisabled) || undefined}
              value={domValues[i]}
              onBlur={!readonly ? blurHandlers[i] : undefined}
              onFocus={!readonly ? focusHandlers[i] : undefined}
              {...optionAttributes}
            >
              {option.label}
            </Checkbox>
            {!inline && <br />}
          </span>
        ))}
    </Checkbox.Group>
  ) : null;
}
