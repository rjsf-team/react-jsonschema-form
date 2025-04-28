import { forwardRef, InputHTMLAttributes, ReactNode, Ref } from 'react';
import { Checkbox as ChakraCheckbox } from '@chakra-ui/react';

export interface CheckboxProps extends ChakraCheckbox.RootProps {
  icon?: ReactNode;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  rootRef?: Ref<HTMLLabelElement>;
}

/**
 * Checkbox component that allows users to select or deselect an option.
 *
 * @param {CheckboxProps} props - The properties for the checkbox component.
 * @param {ReactNode} [props.icon] - The icon to display in the checkbox.
 * @param {InputHTMLAttributes<HTMLInputElement>} [props.inputProps] - Additional props for the input element.
 * @param {Ref<HTMLLabelElement>} [props.rootRef] - Ref for the root element of the checkbox.
 * @returns {JSX.Element} The rendered checkbox component.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, ref) {
  const { icon, children, inputProps, rootRef, ...rest } = props;
  return (
    <ChakraCheckbox.Root ref={rootRef} {...rest}>
      <ChakraCheckbox.HiddenInput ref={ref} {...inputProps} />
      <ChakraCheckbox.Control>{icon || <ChakraCheckbox.Indicator />}</ChakraCheckbox.Control>
      {children != null && <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>}
    </ChakraCheckbox.Root>
  );
});
