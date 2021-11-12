import React from 'react';

import { FieldProps } from '@rjsf/core';

import { Typography } from '@mui/material';

const DescriptionField = ({ description }: FieldProps) => {
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
