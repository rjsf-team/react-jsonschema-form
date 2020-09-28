import React from 'react'
import { Box, Heading, Divider } from '@chakra-ui/core'

const TitleField = ({ title }, ...rest) => (
  <Box mb={1} mt={1}>
    <Heading as="h5" fontWeight="500" color="green.800" size="md" mt={6} {...rest}>
      {title}
    </Heading>
    <Divider />
  </Box>
)

export default TitleField
