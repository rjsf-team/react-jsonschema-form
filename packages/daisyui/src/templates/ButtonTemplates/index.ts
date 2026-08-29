import AddButton from './AddButton.js';
import { ClearButton, CopyButton, MoveDownButton, MoveUpButton, RemoveButton } from './IconButton.js';
import SubmitButton from './SubmitButton.js';

export { AddButton };
export { CopyButton, MoveDownButton, MoveUpButton, RemoveButton, ClearButton };
export { SubmitButton };

// Create a default export with all button templates
const buttonTemplates = {
  AddButton,
  CopyButton,
  MoveDownButton,
  MoveUpButton,
  RemoveButton,
  SubmitButton,
  ClearButton,
};

export default buttonTemplates;
