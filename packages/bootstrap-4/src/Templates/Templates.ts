import AddButton from "../AddButton";
import ArrayFieldItemTemplate from "../ArrayFieldItemTemplate";
import ArrayFieldTemplate from "../ArrayFieldTemplate";
import BaseInputTemplate from "../BaseInputTemplate/BaseInputTemplate";
import DescriptionField from "../DescriptionField";
import ErrorList from "../ErrorList";
import { MoveDownButton, MoveUpButton, RemoveButton } from "../IconButton";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import SubmitButton from "../SubmitButton";
import TitleField from "../TitleField";

export default {
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  BaseInputTemplate,
  ButtonTemplates: {
    AddButton,
    MoveDownButton,
    MoveUpButton,
    RemoveButton,
    SubmitButton,
  },
  DescriptionFieldTemplate: DescriptionField,
  ErrorListTemplate: ErrorList,
  FieldTemplate,
  ObjectFieldTemplate,
  TitleFieldTemplate: TitleField,
};
