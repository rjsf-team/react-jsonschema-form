import React, { useContext } from 'react';
import { AddButtonProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext/MuiComponentContext';

const AddButton: React.FC<AddButtonProps> = props => {
  const { AddIcon, Button } = useContext(MuiComponentContext);

  return (
    <Button {...props} color="secondary">
      <AddIcon /> Add Item
    </Button>
  );
}

export default AddButton;
