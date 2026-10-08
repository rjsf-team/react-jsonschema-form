import type { InputHTMLAttributes, Ref } from 'react';
import { RadioGroup as ChakraRadioGroup } from '@chakra-ui/react';

export interface RadioProps extends ChakraRadioGroup.ItemProps {
  /** Ref for the root element of the radio; `ref` itself goes to the hidden `<input>` instead */
  rootRef?: Ref<HTMLDivElement>;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Radio component that allows users to select a single option from a set.
 *
 * @param props - The properties for the radio component.
 * @param [props.inputProps] - Additional props for the input element.
 * @param [props.rootRef] - Ref for the root element of the radio.
 * @returns The rendered radio component.
 */
export const Radio = ({ children, inputProps, rootRef, ref, ...rest }: RadioProps) => (
  <ChakraRadioGroup.Item ref={rootRef} {...rest}>
    <ChakraRadioGroup.ItemHiddenInput ref={ref} {...inputProps} />
    <ChakraRadioGroup.ItemIndicator />
    {children && <ChakraRadioGroup.ItemText>{children}</ChakraRadioGroup.ItemText>}
  </ChakraRadioGroup.Item>
);

export const RadioGroup = ChakraRadioGroup.Root;
