import React from 'react'
import { Box, Heading, Divider, HeadingProps } from '@chakra-ui/core'
import { WidgetProps } from '@rjsf/core'

const TitleField: React.FC<WidgetProps & HeadingProps> = ({ title }) => (
  <Box mb={1} mt={1}>
    <Heading as="h5" fontWeight="500" color="green.800" size="md" mt={6}>
      {title}
    </Heading>
    <Divider />
  </Box>
)

export default TitleField
