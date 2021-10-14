import React from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ErrorIcon from '@mui/icons-material/Error'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'

import { ErrorListProps } from '@rjsf/core'

const ErrorList = ({ errors }: ErrorListProps) => (
  <Paper elevation={2}>
    <Box mb={2} p={2}>
      <Typography variant="h6">Errors</Typography>
      <List dense={true}>
        {errors.map((error, i: number) => {
          return (
            <ListItem key={i}>
              <ListItemIcon>
                <ErrorIcon color="error" />
              </ListItemIcon>
              <ListItemText primary={error.stack} />
            </ListItem>
          )
        })}
      </List>
    </Box>
  </Paper>
)

export default ErrorList
