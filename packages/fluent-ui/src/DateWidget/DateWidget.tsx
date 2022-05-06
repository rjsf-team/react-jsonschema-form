import React from "react";
import { WidgetProps } from "@rjsf/core";
import {
  DatePicker,
  DayOfWeek,
  mergeStyleSets,
} from "@fluentui/react";
import _pick from "lodash/pick";
import { utils } from "@rjsf/core";

const { pad } = utils;

// Keys of IDropdownProps from @fluentui/react
const allowedProps = [
  "componentRef",
  "styles",
  "theme",
  "calloutProps",
  "calendarProps",
  "textField",
  "calendarAs",
  "onSelectDate",
  "label",
  "isRequired",
  "disabled",
  "ariaLabel",
  "underlined",
  "pickerAriaLabel",
  "isMonthPickerVisible",
  "showMonthPickerAsOverlay",
  "allowTextInput",
  "disableAutoFocus",
  "placeholder",
  "today",
  "value",
  "formatDate",
  "parseDateFromString",
  "firstDayOfWeek",
  "strings",
  "highlightCurrentMonth",
  "highlightSelectedMonth",
  "showWeekNumbers",
  "firstWeekOfYear",
  "showGoToToday",
  "borderless",
  "className",
  "dateTimeFormatter",
  "minDate",
  "maxDate",
  "initialPickerDate",
  "allFocusable",
  "onAfterMenuDismiss",
  "showCloseButton",
  "tabIndex"
];

const controlClass = mergeStyleSets({
  control: {
    margin: "0 0 15px 0",
  },
});

// TODO: move to utils.
// TODO: figure out a standard format for this, as well as
// how we can get this to work with locales.
const formatDate = (date?: Date) => {
  if (!date) {
    return "";
  }
  const yyyy = pad(date.getFullYear(), 4);	
  const MM = pad(date.getMonth() + 1, 2);	
  const dd = pad(date.getDate(), 2);
  return `${yyyy}-${MM}-${dd}`
}

const parseDate = (dateStr?: string) => {
  if (!dateStr) {
    return undefined;
  }
  const [year, month, day] = dateStr.split("-").map(e => parseInt(e));
  var dt = new Date(year, month - 1, day);
  return dt;
}

const DateWidget = ({
  id,
  required,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  options,
  placeholder,
}: WidgetProps) => {
  const _onSelectDate = (date: Date | null | undefined) => {
    if (date) {
      const formatted = formatDate(date);
      formatted && onChange(formatted);
    }
  }
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const uiProps = _pick(options.props || {}, allowedProps);
  return (
    <DatePicker
      className={controlClass.control}
      firstDayOfWeek={DayOfWeek.Sunday}
      placeholder={placeholder}
      ariaLabel="Select a date"
      isRequired={required}
      label={label}
      onSelectDate={_onSelectDate}
      onBlur={_onBlur}
      onFocus={_onFocus}
      value={parseDate(value)}
      {...uiProps}
    />
  );
};

export default DateWidget;
