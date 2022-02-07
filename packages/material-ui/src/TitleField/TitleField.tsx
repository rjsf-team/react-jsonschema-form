import React, { useContext } from 'react';
import { FieldProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext/MuiComponentContext';

const TitleField = ({ title }: FieldProps) => {
  const { Box, Divider, Typography } = useContext(MuiComponentContext);
  return (
    <Box mb={1} mt={1}>
      <Typography variant="h5">{title}</Typography>
      <Divider/>
    </Box>
  );
}

export default TitleField;
