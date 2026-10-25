import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxWidget from './CheckboxWidget/CheckboxWidget.tsx';
import DateTimeWidget from './DateTimeWidget/DateTimeWidget.tsx';
import DateWidget from './DateWidget/DateWidget.tsx';
import RatingWidget from './RatingWidget/RatingWidget.tsx';
import SelectWidget from './SelectWidget/SelectWidget.tsx';
import TimeWidget from './TimeWidget/TimeWidget.tsx';
import ToggleWidget from './ToggleWidget/ToggleWidget.tsx';

export { CheckboxWidget, DateTimeWidget, DateWidget, RatingWidget, SelectWidget, TimeWidget, ToggleWidget };

export function createWidgets() {
  return {
    CheckboxWidget,
    DateTimeWidget,
    DateWidget,
    RatingWidget,
    SelectWidget,
    TimeWidget,
    toggle: ToggleWidget,
  };
}

export function generateWidgets<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): RegistryWidgetsType<T, S, F> {
  return createWidgets();
}

export default createWidgets();
