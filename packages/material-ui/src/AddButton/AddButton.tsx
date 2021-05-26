import React from 'react';

import { AddButtonProps } from '@rjsf/core';

import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import { useIntl } from 'react-intl';

const AddButton: React.FC<AddButtonProps> = props => (
  <Button {...props} color="secondary">
    <AddIcon /> {useIntl().formatMessage({ defaultMessage: 'Add Item' })}
  </Button>
);

export default AddButton;
