import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxWidget from './CheckboxWidget/index.ts';
import DateTimeWidget from './DateTimeWidget/index.ts';
import DateWidget from './DateWidget/index.ts';
import RatingWidget from './RatingWidget/index.ts';
import SelectWidget from './SelectWidget/index.ts';
import TimeWidget from './TimeWidget/index.ts';
import ToggleWidget from './ToggleWidget/index.ts';

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
