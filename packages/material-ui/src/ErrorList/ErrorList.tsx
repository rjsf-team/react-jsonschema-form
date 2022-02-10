import React, { useContext } from 'react';
import { ErrorListProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext/MuiComponentContext';

const ErrorList = ({ errors }: ErrorListProps) => {
  const { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Paper, ErrorIcon } = useContext(MuiComponentContext);
  return (
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
                  <ErrorIcon color="error"/>
                </ListItemIcon>
                <ListItemText primary={error.stack}/>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
}

export default ErrorList;
