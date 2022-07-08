import React from 'react';
import { AddButtonProps } from '@rjsf/core';

import { useMuiComponent } from '../MuiComponentContext';

const AddButton: React.ComponentType<AddButtonProps> = props => {
  const { AddIcon, Button } = useMuiComponent();

  return (
    <Button {...props} color="secondary">
      <AddIcon /> Add Item
    </Button>
  );
};

export default AddButton;
