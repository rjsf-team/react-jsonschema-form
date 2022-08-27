import { TemplatesType } from "@rjsf/utils";

import SubmitButton from "./SubmitButton";
import AddButton from "./AddButton";
import { RemoveButton, MoveDownButton, MoveUpButton } from "./IconButton";

const buttonTemplates: TemplatesType["ButtonTemplates"] = {
  SubmitButton,
  AddButton,
  MoveDownButton,
  MoveUpButton,
  RemoveButton,
};

export default buttonTemplates;
