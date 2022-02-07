import React, { useContext } from 'react';
import { FieldProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext/MuiComponentContext';

const DescriptionField = ({ description }: FieldProps) => {
  const { Typography } = useContext(MuiComponentContext);
  if (description) {
    return (
      <Typography variant="subtitle2" style={{ marginTop: '5px' }}>
        {description}
      </Typography>
    );
  }

  return null;
};

export default DescriptionField;
