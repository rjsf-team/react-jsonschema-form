import { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from './AltDateTimeWidget/AltDateTimeWidget';
import AltDateWidget from './AltDateWidget/AltDateWidget';
import CheckboxWidget from './CheckboxWidget/CheckboxWidget';
import CheckboxesWidget from './CheckboxesWidget/CheckboxesWidget';
import DateTimeWidget from './DateTimeWidget/DateTimeWidget';
import DateWidget from './DateWidget/DateWidget';
import FileWidget from './FileWidget/FileWidget';
import RadioWidget from './RadioWidget/RadioWidget';
import RangeWidget from './RangeWidget/RangeWidget';
import RatingWidget from './RatingWidget/RatingWidget';
import SelectWidget from './SelectWidget/SelectWidget';
import TextareaWidget from './TextareaWidget/TextareaWidget';
import TimeWidget from './TimeWidget/TimeWidget';
import ToggleWidget from './ToggleWidget/ToggleWidget';

export {
  AltDateTimeWidget,
  AltDateWidget,
  CheckboxesWidget,
  CheckboxWidget,
  DateTimeWidget,
  DateWidget,
  FileWidget,
  RadioWidget,
  RangeWidget,
  RatingWidget,
  SelectWidget,
  TextareaWidget,
  TimeWidget,
  ToggleWidget,
};

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): RegistryWidgetsType<T, S, F> {
  return {
    AltDateTimeWidget,
    AltDateWidget,
    CheckboxesWidget,
    CheckboxWidget,
    DateTimeWidget,
    DateWidget,
    FileWidget,
    RadioWidget,
    RangeWidget,
    RatingWidget,
    SelectWidget,
    TextareaWidget,
    TimeWidget,
    toggle: ToggleWidget,
  };
}

export default generateWidgets;
