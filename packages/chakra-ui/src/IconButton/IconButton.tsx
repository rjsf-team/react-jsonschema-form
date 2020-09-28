import React from 'react'
import ChakraIconButton from '@chakra-ui/core/dist/IconButton'

const mappings = {
  'remove': 'minus',
  'plus': 'add',
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down'
}

const IconButton = props => {
  const { icon, ...otherProps } = props
  return <ChakraIconButton {...otherProps} size="sm" icon={mappings[icon]} />
}

export default IconButton
