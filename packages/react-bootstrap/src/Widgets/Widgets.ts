import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxesWidget from '../CheckboxesWidget/index.ts';
import CheckboxWidget from '../CheckboxWidget/index.ts';
import RadioWidget from '../RadioWidget/index.ts';
import RangeWidget from '../RangeWidget/index.ts';
import SelectWidget from '../SelectWidget/index.ts';
import TextareaWidget from '../TextareaWidget/index.ts';

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
