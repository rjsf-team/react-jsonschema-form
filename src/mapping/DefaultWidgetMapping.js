import AltDateTimeWidget from "../components/widgets/AltDateTimeWidget";
import AltDateWidget from "../components/widgets/AltDateWidget";
import CheckboxesWidget from "../components/widgets/CheckboxesWidget";
import CheckboxWidget from "../components/widgets/CheckboxWidget";
import ColorWidget from "../components/widgets/ColorWidget";
import DateTimeWidget from "../components/widgets/DateTimeWidget";
import DateWidget from "../components/widgets/DateWidget";
import EmailWidget from "../components/widgets/EmailWidget";
import FileWidget from "../components/widgets/FileWidget";
import HiddenWidget from "../components/widgets/HiddenWidget";
import PasswordWidget from "../components/widgets/PasswordWidget";
import RadioWidget from "../components/widgets/RadioWidget";
import RangeWidget from "../components/widgets/RangeWidget";
import SelectWidget from "../components/widgets/SelectWidget";
import TextWidget from "../components/widgets/TextWidget";
import TextareaWidget from "../components/widgets/TextareaWidget";
import UpDownWidget from "../components/widgets/UpDownWidget";
import URLWidget from "../components/widgets/URLWidget";

const defaultWidgetMap = {
  boolean: CheckboxWidget,
  string: TextWidget,
  number: TextWidget,
  integer: TextWidget,
  array: SelectWidget
};

const altWidgetMap = {
  boolean: {
    radio: RadioWidget,
    select: SelectWidget,
    hidden: HiddenWidget,
  },
  string: {
    password: PasswordWidget,
    radio: RadioWidget,
    select: SelectWidget,
    textarea: TextareaWidget,
    hidden: HiddenWidget,
    date: DateWidget,
    datetime: DateTimeWidget,
    "alt-date": AltDateWidget,
    "alt-datetime": AltDateTimeWidget,
    color: ColorWidget,
    file: FileWidget,
  },
  number: {
    updown: UpDownWidget,
    range: RangeWidget,
    radio: RadioWidget,
    hidden: HiddenWidget,
  },
  integer: {
    updown: UpDownWidget,
    range: RangeWidget,
    radio: RadioWidget,
    hidden: HiddenWidget,
  },
  array: {
    select: SelectWidget,
    checkboxes: CheckboxesWidget,
    file: FileWidget,
  }
};

const stringFormatWidgets = {
  "date-time": DateTimeWidget,
  "date": DateWidget,
  "email": EmailWidget,
  "hostname": TextWidget,
  "ipv4": TextWidget,
  "ipv6": TextWidget,
  "uri": URLWidget,
  "data-url": FileWidget,
};

export default {
  defaultWidgetMap,
  altWidgetMap,
  stringFormatWidgets
};