import React from 'react';

import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

import { ErrorListProps } from '@rjsf/core';

const ErrorList = ({ errors }: ErrorListProps) => (
  <Paper elevation={2}>
    <Box mb={2} p={2}>
      <Typography variant="h6">
        Errors
      </Typography>
      <List dense={true}>
        {errors.map((error, i: number) => {
          return (
            <ListItem key={i}>
              <ListItemIcon>
                <ErrorIcon color="error" />
              </ListItemIcon>
              <ListItemText primary={error.stack} />
            </ListItem>
          );
        })}
      </List>
    </Box>
  </Paper>
);

export default ErrorList;
