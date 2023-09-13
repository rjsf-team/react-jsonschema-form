import { FocusEvent } from 'react';
import {
  ariaDescribedByIds,
  labelValue,
  pad,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

import { DateInput } from '@appfolio/react-gears';

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
  placeholder,
}: WidgetProps<T, S, F>) {
  const _onSelectDate = (date: Date | null | undefined) => {
    if (date) {
      const formatted = formatDate(date);
      formatted && onChange(formatted);
    }
  };
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <>
      <DateInput
        id={id}
        className='mb-1'
        placeholder={placeholder}
        required={required}
        // @ts-expect-error todo: TS2322: Type 'string | false | ReactElement<any, string | JSXElementConstructor<any>> | undefined' is not assignable to type 'string | undefined'.
        label={labelValue(label, hideLabel)}
        onSelectDate={_onSelectDate}
        onBlur={_onBlur}
        onFocus={_onFocus}
        value={parseDate(value)}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </>
  );
}
