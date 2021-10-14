import React from 'react'

import { AddButtonProps } from '@rjsf/core'

import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'

const AddButton: React.FC<AddButtonProps> = (props) => {
  const { ...props2 } = props

  return (
    <Button {...props2} color="secondary">
      <AddIcon /> Add Item
    </Button>
  )
}

export default AddButton
