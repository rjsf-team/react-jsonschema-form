import type { ComponentProps, InputHTMLAttributes, ReactNode } from 'react';
import { Checkbox as ChakraCheckbox } from '@chakra-ui/react';

export interface CheckboxProps extends Omit<ComponentProps<typeof ChakraCheckbox.Root>, 'ref'> {
  icon?: ReactNode;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  /** Ref for the root element of the checkbox; `ref` itself goes to the hidden `<input>` instead */
  rootRef?: ComponentProps<typeof ChakraCheckbox.Root>['ref'];
  ref?: ComponentProps<typeof ChakraCheckbox.HiddenInput>['ref'];
}

/**
 * Checkbox component that allows users to select or deselect an option.
 *
 * @param props - The properties for the checkbox component.
 * @param [props.icon] - The icon to display in the checkbox.
 * @param [props.inputProps] - Additional props for the input element.
 * @param [props.rootRef] - Ref for the root element of the checkbox.
 * @returns The rendered checkbox component.
 */
export const Checkbox = ({ icon, children, inputProps, rootRef, ref, ...rest }: CheckboxProps) => (
  <ChakraCheckbox.Root ref={rootRef} {...rest}>
    <ChakraCheckbox.HiddenInput ref={ref} {...inputProps} />
    <ChakraCheckbox.Control>{icon || <ChakraCheckbox.Indicator />}</ChakraCheckbox.Control>
    {children != null && <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>}
  </ChakraCheckbox.Root>
);
