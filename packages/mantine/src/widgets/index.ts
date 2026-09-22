import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxesWidget from './CheckboxesWidget.tsx';
import CheckboxWidget from './CheckboxWidget.tsx';
import ColorWidget from './ColorWidget.tsx';
import { AltDateTimeWidget, AltDateWidget, DateWidget, DateTimeWidget, TimeWidget } from './DateTime/index.ts';
import FileWidget from './FileWidget.tsx';
import PasswordWidget from './PasswordWidget.tsx';
import RadioWidget from './RadioWidget.tsx';
import RangeWidget from './RangeWidget.tsx';
import SelectWidget from './SelectWidget.tsx';
import TextareaWidget from './TextareaWidget.tsx';

const widgets = {
  AltDateTimeWidget,
  AltDateWidget,
  CheckboxesWidget,
  CheckboxWidget,
  ColorWidget,
  FileWidget,
  DateTimeWidget,
  DateWidget,
  PasswordWidget,
  RadioWidget,
  RangeWidget,
  SelectWidget,
  TextareaWidget,
  TimeWidget,
};

export function generateWidgets<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): RegistryWidgetsType<T, S, F> {
  return widgets;
}

export default widgets;
