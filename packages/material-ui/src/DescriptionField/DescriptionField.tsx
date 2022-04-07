import React from 'react';
import { FieldProps } from '@rjsf/core';

import { useMuiComponent } from '../MuiComponentContext';

const DescriptionField = ({ description }: FieldProps) => {
  const { Typography } = useMuiComponent();
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
