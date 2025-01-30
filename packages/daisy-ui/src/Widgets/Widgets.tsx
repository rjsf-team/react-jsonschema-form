import CheckboxWidget from '../Widgets/CheckboxWidget/CheckboxWidget';
import CheckboxesWidget from '../Widgets/CheckboxesWidget/CheckboxesWidget';
import RadioWidget from '../Widgets/RadioWidget/RadioWidget';
import RangeWidget from '../Widgets/RangeWidget/RangeWidget';
import SelectWidget from '../Widgets/SelectWidget/SelectWidget';
import TextareaWidget from '../Widgets/TextareaWidget/TextareaWidget';
import { StrictRJSFSchema, RJSFSchema, FormContextType, RegistryWidgetsType } from '@rjsf/utils';
import AltDateWidget from '../Widgets/AltDateWidget/AltDateWidget';
import AltDateTimeWidget from '../Widgets/AltDateTimeWidget/AltDateTimeWidget';
import TimeWidget from '../Widgets/TimeWidget/TimeWidget';

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): RegistryWidgetsType<T, S, F> {
  return {
    AltDateWidget,
    AltDateTimeWidget,
    TimeWidget,
    DateWidget: ({ onChange, onFocus, onBlur, ...props }) => (
      <input
        type='date'
        className='input input-bordered w-full'
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => onFocus(props.id, event.target.value)}
        onBlur={(event) => onBlur(props.id, event.target.value)}
        {...props}
      />
    ),
    DateTimeWidget: ({ onChange, onFocus, onBlur, ...props }) => (
      <input
        type='datetime-local'
        className='input input-bordered w-full'
        {...props}
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => onFocus(props.id, event.target.value)}
        onBlur={(event) => onBlur(props.id, event.target.value)}
      />
    ),
    CheckboxWidget,
    CheckboxesWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
  };
}
export default generateWidgets;
