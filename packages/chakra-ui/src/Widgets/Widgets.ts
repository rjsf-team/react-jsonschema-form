import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from '../AltDateTimeWidget/index.ts';
import AltDateWidget from '../AltDateWidget/index.ts';
import CheckboxesWidget from '../CheckboxesWidget/index.ts';
import CheckboxWidget from '../CheckboxWidget/index.ts';
import NativeSelectWidget from '../NativeSelectWidget/index.ts';
import RadioWidget from '../RadioWidget/index.ts';
import RangeWidget from '../RangeWidget/index.ts';
import SelectWidget from '../SelectWidget/index.ts';
import TextareaWidget from '../TextareaWidget/index.ts';
import UpDownWidget from '../UpDownWidget/index.ts';

export function createWidgets() {
  return {
    AltDateTimeWidget,
    AltDateWidget,
    CheckboxWidget,
    CheckboxesWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    NativeSelectWidget,
    TextareaWidget,
    UpDownWidget,
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
