import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from './AltDateTimeWidget/AltDateTimeWidget.js';
import AltDateWidget from './AltDateWidget/AltDateWidget.js';
import CheckboxesWidget from './CheckboxesWidget/CheckboxesWidget.js';
import CheckboxWidget from './CheckboxWidget/CheckboxWidget.js';
import DateTimeWidget from './DateTimeWidget/DateTimeWidget.js';
import DateWidget from './DateWidget/DateWidget.js';
import RadioWidget from './RadioWidget/RadioWidget.js';
import RangeWidget from './RangeWidget/RangeWidget.js';
import RatingWidget from './RatingWidget/RatingWidget.js';
import SelectWidget from './SelectWidget/SelectWidget.js';
import TextareaWidget from './TextareaWidget/TextareaWidget.js';
import TimeWidget from './TimeWidget/TimeWidget.js';
import ToggleWidget from './ToggleWidget/ToggleWidget.js';

export {
  AltDateTimeWidget,
  AltDateWidget,
  CheckboxesWidget,
  CheckboxWidget,
  DateTimeWidget,
  DateWidget,
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
