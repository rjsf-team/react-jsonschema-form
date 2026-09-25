import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget.tsx';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget.tsx';
import RadioWidget from '../RadioWidget/RadioWidget.tsx';
import RangeWidget from '../RangeWidget/RangeWidget.tsx';
import SelectWidget from '../SelectWidget/SelectWidget.tsx';
import TextareaWidget from '../TextareaWidget/TextareaWidget.tsx';

export function createWidgets() {
  return {
    CheckboxWidget,
    CheckboxesWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
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
