import { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';

import Checkbox from './Checkbox';
import ComboBox from './ComboBox';
import Radio from './Radio';
import Select from './Select';
import BaseInput from '../Templates/BaseInput';
import TextArea from './TextArea';
import UpDown from './UpDown';
import Range from './Range';

export function generateWidgets<T = any, S extends RJSFSchema = RJSFSchema, F extends FormContextType = any>(): Partial<WidgetProps<T, S, F>> {
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
