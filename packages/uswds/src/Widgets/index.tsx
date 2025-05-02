import { FormContextType, RJSFSchema, StrictRJSFSchema, Widget } from '@rjsf/utils';

import Checkbox from './Checkbox';
import ComboBox from './ComboBox';
import Radio from './Radio';
import Select from './Select';
import BaseInput from '../Templates/BaseInput';
import TextArea from './TextArea';
import UpDown from './UpDown';
import Range from './Range';

export type WidgetsType<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> = {
  [name: string]: Widget<T, S, F>;
};

export function generateWidgets<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(): Partial<WidgetsType<T, S, F>> {
  return {
    CheckboxWidget: Checkbox,
    ComboBoxWidget: ComboBox,
    RadioWidget: Radio,
    RangeWidget: Range,
    SelectWidget: Select,
    TextWidget: BaseInput,
    TextareaWidget: TextArea,
    UpDownWidget: UpDown,
  };
}

export default generateWidgets();