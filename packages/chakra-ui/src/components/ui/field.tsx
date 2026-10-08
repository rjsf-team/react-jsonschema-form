import type { ComponentProps, ReactNode } from 'react';
import { Field as ChakraField } from '@chakra-ui/react';

export interface FieldProps extends Omit<ComponentProps<typeof ChakraField.Root>, 'label'> {
  label?: ReactNode;
  helperText?: ReactNode;
  errorText?: ReactNode;
  optionalText?: ReactNode;
}

/**
 * Field component that serves as a wrapper for form fields, providing
 * additional functionality such as labels, helper text, and error messages.
 *
 * @param props - The properties for the field component.
 * @param [props.label] - The label for the field.
 * @param [props.helperText] - Helper text to display below the field.
 * @param [props.errorText] - Error message to display below the field.
 * @param [props.optionalText] - Text to indicate that the field is optional.
 * @returns The rendered field component.
 */
export const Field = ({ label, children, helperText, errorText, optionalText, ref, ...rest }: FieldProps) => (
  <ChakraField.Root ref={ref} {...rest}>
    {label && (
      <ChakraField.Label>
        {label}
        <ChakraField.RequiredIndicator fallback={optionalText} />
      </ChakraField.Label>
    )}
    {children}
    {helperText && <ChakraField.HelperText>{helperText}</ChakraField.HelperText>}
    {errorText && <ChakraField.ErrorText>{errorText}</ChakraField.ErrorText>}
  </ChakraField.Root>
);
