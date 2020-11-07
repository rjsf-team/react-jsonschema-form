import { Box, Heading } from '@chakra-ui/core'
import { List, ListIcon, ListItem } from '@chakra-ui/core'
import { ErrorListProps } from '@rjsf/core'
import React from 'react'

const ErrorList = ({ errors }: ErrorListProps) => (
  <Box mb={2} p={2}>
    <Heading as="h6" size="md" fontWeight="500" color="red.600">Errors</Heading>
    <List spacing={2}>
      {errors.map((error, i) => (
        <ListItem key={i}>
          <ListIcon icon="warning-2" />
          {error.stack}
        </ListItem>
      ))}
    </List>
  </Box>
)

export default ErrorList
