import BaseInput from '../BaseInput/BaseInput'
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget'
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget'
import RadioWidget from '../RadioWidget/RadioWidget'
import RangeWidget from '../RangeWidget/RangeWidget'
import SelectWidget from '../SelectWidget/SelectWidget'
import TextareaWidget from '../TextareaWidget/TextareaWidget'
import UpDownWidget from '../UpDownWidget/UpDownWidget'

const widgets = {
  BaseInput,
  CheckboxWidget,
  CheckboxesWidget,
  radio: RadioWidget,
  RangeWidget,
  select: SelectWidget,
  TextareaWidget,
  UpDownWidget
}

export default widgets
