import AltDateWidget from "./AltDateWidget";
import AltDateTimeWidget from "./AltDateTimeWidget";
import BaseInput from "./BaseInput";
import CheckboxWidget from "./CheckboxWidget";
import CheckboxesWidget from "./CheckboxesWidget";
import ColorWidget from "./ColorWidget";
import DateWidget from "./DateWidget";
import DateTimeWidget from "./DateTimeWidget";
import EmailWidget from "./EmailWidget";
import FileWidget from "./FileWidget";
import HiddenWidget from "./HiddenWidget";
import PasswordWidget from "./PasswordWidget";
import RadioWidget from "./RadioWidget";
import RangeWidget from "./RangeWidget";
import SelectWidget from "./SelectWidget";
import TextareaWidget from "./TextareaWidget";
import TextWidget from "./TextWidget";
import URLWidget from "./URLWidget";
import UpDownWidget from "./UpDownWidget";

const widgetMap = {
  boolean: {
    checkbox: "CheckboxWidget",
    radio: "RadioWidget",
    select: "SelectWidget",
    hidden: "HiddenWidget",
  },
  string: {
    text: "TextWidget",
    password: "PasswordWidget",
    email: "EmailWidget",
    hostname: "TextWidget",
    ipv4: "TextWidget",
    ipv6: "TextWidget",
    uri: "URLWidget",
    "data-url": "FileWidget",
    radio: "RadioWidget",
    select: "SelectWidget",
    textarea: "TextareaWidget",
    hidden: "HiddenWidget",
    date: "DateWidget",
    datetime: "DateTimeWidget",
    "date-time": "DateTimeWidget",
    "alt-date": "AltDateWidget",
    "alt-datetime": "AltDateTimeWidget",
    color: "ColorWidget",
    file: "FileWidget",
  },
  number: {
    text: "TextWidget",
    select: "SelectWidget",
    updown: "UpDownWidget",
    range: "RangeWidget",
    radio: "RadioWidget",
    hidden: "HiddenWidget",
  },
  integer: {
    text: "TextWidget",
    select: "SelectWidget",
    updown: "UpDownWidget",
    range: "RangeWidget",
    radio: "RadioWidget",
    hidden: "HiddenWidget",
  },
  array: {
    select: "SelectWidget",
    checkboxes: "CheckboxesWidget",
    files: "FileWidget",
  },
};

export default {
  BaseInput,
  PasswordWidget,
  RadioWidget,
  UpDownWidget,
  RangeWidget,
  SelectWidget,
  TextWidget,
  DateWidget,
  DateTimeWidget,
  AltDateWidget,
  AltDateTimeWidget,
  EmailWidget,
  URLWidget,
  TextareaWidget,
  HiddenWidget,
  ColorWidget,
  FileWidget,
  CheckboxWidget,
  CheckboxesWidget,
  __widgetMap: widgetMap,
};
