import dayjs from 'dayjs';
import {
  ariaDescribedByIds,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

import DatePicker from '../../components/DatePicker';

const DATE_PICKER_STYLE = {
  width: '100%',
};

/** The `DateTimeWidget` component uses the `BaseInputTemplate` changing the type to `datetime-local` and transforms
 * the value to/from utc using the appropriate utility functions.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { disabled, formContext, id, onBlur, onChange, onFocus, placeholder, readonly, value } = props;
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;

  const handleChange = (nextValue: any) => onChange(nextValue && nextValue.toISOString());

  const handleBlur = () => onBlur(id, value);

  const handleFocus = () => onFocus(id, value);

  const getPopupContainer = (node: any) => node.parentNode;

  return (
    <DatePicker
      disabled={disabled || (readonlyAsDisabled && readonly)}
      getPopupContainer={getPopupContainer}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      showTime
      style={DATE_PICKER_STYLE}
      value={value && dayjs(value)}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
