import { FormContextType, RJSFSchema, StrictRJSFSchema, Widget } from '@rjsf/utils';

import Checkbox from './Checkbox';
import Radio from './Radio';
import Range from './Range';
import Select from './Select';
import TextArea from './TextArea';

export type WidgetsType<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> = {
  [name: string]: Widget<T, S, F>;
};

export function generateWidgets<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(): Partial<WidgetsType<T, S, F>> {
  return {
    CheckboxWidget: Checkbox,
    RadioWidget: Radio,
    RangeWidget: Range,
    SelectWidget: Select,
    TextareaWidget: TextArea,
  };
}

export default generateWidgets();