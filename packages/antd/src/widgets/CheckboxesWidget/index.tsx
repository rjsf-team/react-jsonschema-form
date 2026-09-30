import type { FormContextType, WidgetProps, RJSFSchema, StrictRJSFSchema, GenericObjectType } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionsDomValues,
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
}: WidgetProps<T, S, F>) {
  const { formContext } = registry;
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;

  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleChange = (nextValue: any) =>
    onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  // Antd's typescript definitions for `Checkbox.Group` do not contain `id`, which it does use when provided, so it is
  // spread on via `extraProps` to avoid a typescript error
  const extraProps = { id };

  const selectValue = enumOptionSelectedValue(value, enumOptions, true, optionValueFormat, []) as string[];

  return Array.isArray(enumOptions) && enumOptions.length > 0 ? (
    <Checkbox.Group
      disabled={disabled || (readonlyAsDisabled && readonly)}
      name={htmlName || id}
      onChange={!readonly ? handleChange : undefined}
      value={selectValue}
      {...extraProps}
      aria-describedby={ariaDescribedByIds(id)}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, i) => (
          // oxlint-disable-next-line react/no-array-index-key
          <span key={i}>
            <Checkbox
              id={optionId(id, i)}
              name={htmlName || id}
              autoFocus={i === 0 ? autofocus : false}
              disabled={
                Array.isArray(enumDisabled) && enumDisabled.some((disabledValue) => disabledValue === option.value)
              }
              value={domValues[i]}
              onBlur={!readonly ? blurHandlers[i] : undefined}
              onFocus={!readonly ? focusHandlers[i] : undefined}
            >
              {option.label}
            </Checkbox>
            {!inline && <br />}
          </span>
        ))}
    </Checkbox.Group>
  ) : null;
}
