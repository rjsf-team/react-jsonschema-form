import React from 'react';

import { FieldProps } from '@rjsf/core';

import { Box, Divider, Typography } from '@mui/material';

const TitleField = ({ title }: FieldProps) => (
  <Box mb={1} mt={1}>
    <Typography variant="h5">{title}</Typography>
    <Divider />
  </Box>
);

export default TitleField;
