import Button, { ButtonProps } from '@chakra-ui/core/dist/Button'
import { AddButtonProps } from '@rjsf/core'
import React from 'react'

const AddButton: React.FC<AddButtonProps | ButtonProps> = props => (
  <Button variant="outline" fontWeight="500" size="sm" leftIcon="add" {...props}>
    {props.children}
  </Button>
)

export default AddButton
