import { forwardRef, ReactNode } from 'react';
import { Field as ChakraField } from '@chakra-ui/react';

export interface FieldProps extends Omit<ChakraField.RootProps, 'label'> {
  label?: ReactNode;
  helperText?: ReactNode;
  errorText?: ReactNode;
  optionalText?: ReactNode;
}

/**
 * Field component that serves as a wrapper for form fields, providing
 * additional functionality such as labels, helper text, and error messages.
 *
 * @param {FieldProps} props - The properties for the field component.
 * @param {ReactNode} [props.label] - The label for the field.
 * @param {ReactNode} [props.helperText] - Helper text to display below the field.
 * @param {ReactNode} [props.errorText] - Error message to display below the field.
 * @param {ReactNode} [props.optionalText] - Text to indicate that the field is optional.
 * @returns {JSX.Element} The rendered field component.
 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(props, ref) {
  const { label, children, helperText, errorText, optionalText, ...rest } = props;
  return (
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
});
