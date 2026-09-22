import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from '../AltDateTimeWidget/AltDateTimeWidget.tsx';
import AltDateWidget from '../AltDateWidget/AltDateWidget.tsx';
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget.tsx';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget.tsx';
import NativeSelectWidget from '../NativeSelectWidget/NativeSelectWidget.tsx';
import RadioWidget from '../RadioWidget/RadioWidget.tsx';
import RangeWidget from '../RangeWidget/RangeWidget.tsx';
import SelectWidget from '../SelectWidget/SelectWidget.tsx';
import TextareaWidget from '../TextareaWidget/TextareaWidget.tsx';
import UpDownWidget from '../UpDownWidget/UpDownWidget.tsx';

const widgets = {
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

export function generateWidgets<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): RegistryWidgetsType<T, S, F> {
  return widgets;
}

export default widgets;
