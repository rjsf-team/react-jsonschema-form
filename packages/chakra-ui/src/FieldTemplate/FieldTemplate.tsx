import React from 'react'
import { FormHelperText, FormControl, FormErrorMessage } from '@chakra-ui/core'
import { FormLabel as WrappedFormLabel } from '@chakra-ui/core'
import { FieldTemplateProps } from '@rjsf/core'

const FieldTemplate = ({ id, children, label, displayLabel, disabled, readonly, required, rawErrors = [], rawHelp }: FieldTemplateProps) => (
  <FormControl isDisabled={disabled} mt={4} isReadOnly={readonly} isRequired={required} isInvalid={!!rawErrors.length}>
    {displayLabel && (
      <WrappedFormLabel fontWeight="500" fontSize="0.9rem" htmlFor={id}>{label}</WrappedFormLabel>
    )}
    {children}
    {rawErrors.length > 0 &&
      rawErrors.map((error, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <FormErrorMessage key={i} id={id}>
          {error}
        </FormErrorMessage>
      ))}
    {rawHelp && <FormHelperText id={id}>{rawHelp}</FormHelperText>}
  </FormControl>
)

export default FieldTemplate
