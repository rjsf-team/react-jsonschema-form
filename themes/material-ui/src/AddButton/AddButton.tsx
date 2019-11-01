import React from 'react';

import { AddButtonProps } from 'react-jsonschema-form';

import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';

const AddButton: React.FC<AddButtonProps> = props => (
  <Button {...props} color="secondary">
    <AddIcon /> Add Item
  </Button>
);

export default AddButton;
