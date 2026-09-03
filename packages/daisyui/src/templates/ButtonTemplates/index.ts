import AddButton from './AddButton.tsx';
import { ClearButton, CopyButton, MoveDownButton, MoveUpButton, RemoveButton } from './IconButton.tsx';
import SubmitButton from './SubmitButton.tsx';

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
