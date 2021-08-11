import React from 'react';

import {AddButtonProps} from '@rjsf/core';

import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';

const AddButton: React.FC<AddButtonProps> = ({className, onClick, disabled, addButtonText}) => (
  <Button
    className={className}
    onClick={onClick}
    disabled={disabled}
    color="secondary"
  >
    <AddIcon/> {addButtonText || "Add Item"}
  </Button>
);

export default AddButton;
