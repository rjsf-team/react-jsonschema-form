import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget.js';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget.js';
import RadioWidget from '../RadioWidget/RadioWidget.js';
import RangeWidget from '../RangeWidget/RangeWidget.js';
import SelectWidget from '../SelectWidget/SelectWidget.js';
import TextareaWidget from '../TextareaWidget/TextareaWidget.js';

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): RegistryWidgetsType<T, S, F> {
  return {
    CheckboxWidget,
    CheckboxesWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
  };
}

export default generateWidgets();
