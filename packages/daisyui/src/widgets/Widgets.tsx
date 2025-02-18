import { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import CheckboxWidget from './CheckboxWidget/CheckboxWidget';
import CheckboxesWidget from './CheckboxesWidget/CheckboxesWidget';
import DateWidget from './DateWidget/DateWidget';
import DateTimeWidget from './DateTimeWidget/DateTimeWidget';
import FileWidget from './FileWidget/FileWidget';
import RadioWidget from './RadioWidget/RadioWidget';
import RangeWidget from './RangeWidget/RangeWidget';
import SelectWidget from './SelectWidget/SelectWidget';
import TextareaWidget from './TextareaWidget/TextareaWidget';
import TimeWidget from './TimeWidget/TimeWidget';
import ToggleWidget from './ToggleWidget/ToggleWidget';
import RatingWidget from './RatingWidget/RatingWidget';

export {
  CheckboxWidget,
  CheckboxesWidget,
  DateWidget,
  DateTimeWidget,
  FileWidget,
  RadioWidget,
  RangeWidget,
  SelectWidget,
  TextareaWidget,
  TimeWidget,
  ToggleWidget,
  RatingWidget,
};

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): RegistryWidgetsType<T, S, F> {
  return {
    CheckboxWidget,
    CheckboxesWidget,
    DateWidget,
    DateTimeWidget,
    FileWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
    TimeWidget,
    toggle: ToggleWidget,
    rating: RatingWidget,
  };
}

export default generateWidgets;
