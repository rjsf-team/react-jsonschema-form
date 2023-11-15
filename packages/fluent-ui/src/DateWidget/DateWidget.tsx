import { FocusEvent } from 'react';
import {
  ariaDescribedByIds,
  labelValue,
  pad,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WidgetProps,
} from '@rjsf/utils';
import { DatePicker, DayOfWeek, mergeStyleSets } from '@fluentui/react';
import _pick from 'lodash/pick';

// Keys of IDropdownProps from @fluentui/react
const allowedProps = [
  'componentRef',
  'styles',
  'theme',
  'calloutProps',
  'calendarProps',
  'textField',
  'calendarAs',
  'onSelectDate',
  'label',
  'isRequired',
  'disabled',
  'ariaLabel',
  'underlined',
  'pickerAriaLabel',
  'isMonthPickerVisible',
  'showMonthPickerAsOverlay',
  'allowTextInput',
  'disableAutoFocus',
  'placeholder',
  'today',
  'value',
  'formatDate',
  'parseDateFromString',
  'firstDayOfWeek',
  'strings',
  'highlightCurrentMonth',
  'highlightSelectedMonth',
  'showWeekNumbers',
  'firstWeekOfYear',
  'showGoToToday',
  'borderless',
  'className',
  'dateTimeFormatter',
  'minDate',
  'maxDate',
  'initialPickerDate',
  'allFocusable',
  'onAfterMenuDismiss',
  'showCloseButton',
  'tabIndex',
];

const controlClass = mergeStyleSets({
  control: {
    margin: '0 0 15px 0',
  },
});

// TODO: move to utils.
// TODO: figure out a standard format for this, as well as
// how we can get this to work with locales.
const formatDate = (date?: Date) => {
  if (!date) {
    return '';
  }
  const yyyy = pad(date.getFullYear(), 4);
  const MM = pad(date.getMonth() + 1, 2);
  const dd = pad(date.getDate(), 2);
  return `${yyyy}-${MM}-${dd}`;
};

const parseDate = (dateStr?: string) => {
  if (!dateStr) {
    return undefined;
  }
  const [year, month, day] = dateStr.split('-').map((e) => parseInt(e));
  const dt = new Date(year, month - 1, day);
  return dt;
};

export default function DateWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  required,
  label,
  hideLabel,
  value,
  onChange,
  onBlur,
  onFocus,
  options,
  placeholder,
  registry,
}: WidgetProps<T, S, F>) {
  const { translateString } = registry;
  const _onSelectDate = (date: Date | null | undefined) => {
    if (date) {
      const formatted = formatDate(date);
      formatted && onChange(formatted);
    }
  };
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const uiProps = _pick((options.props as object) || {}, allowedProps);
  return (
    <DatePicker
      id={id}
      className={controlClass.control}
      firstDayOfWeek={DayOfWeek.Sunday}
      placeholder={placeholder}
      ariaLabel={translateString(TranslatableString.AriaDateLabel)}
      isRequired={required}
      label={labelValue(label, hideLabel)}
      onSelectDate={_onSelectDate}
      onBlur={_onBlur}
      onFocus={_onFocus}
      value={parseDate(value)}
      {...uiProps}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
