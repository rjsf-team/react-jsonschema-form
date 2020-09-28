import Text from '@chakra-ui/core/dist/Text'
import React from 'react'

const DescriptionField = ({ description }) => {
  if (description) {
    return (
      <Text fontSize="sm" mb={2} opacity="0.9">
        {description}
      </Text>
    )
  }

  return null
}

export default DescriptionField
