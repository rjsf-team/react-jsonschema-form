import {
  FormContextType,
  RegistryWidgetsType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import AltDateWidget from "./AltDateWidget";
import AltDateTimeWidget from "./AltDateTimeWidget";
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

function widgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): RegistryWidgetsType<T, S, F> {
  return {
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
  };
}

export default widgets;
