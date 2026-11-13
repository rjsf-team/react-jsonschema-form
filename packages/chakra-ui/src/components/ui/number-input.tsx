import type { ComponentProps } from 'react';
import { NumberInput as ChakraNumberInput } from '@chakra-ui/react';

export interface NumberInputProps extends ComponentProps<typeof ChakraNumberInput.Root> {
  inputProps?: ComponentProps<typeof ChakraNumberInput.Input>;
}

/**
 * NumberInput component that allows users to input numeric values.
 *
 * @param props - The properties for the number input component.
 * @param [props.children] - The content to display inside the number input.
 * @param [props.inputProps] - Additional props for the input element.
 * @returns The rendered number input component.
 */
export const NumberInputRoot = ({ ref, inputProps, ...props }: NumberInputProps) => (
  <ChakraNumberInput.Root ref={ref} variant='outline' {...props}>
    <ChakraNumberInput.Control>
      <ChakraNumberInput.IncrementTrigger />
      <ChakraNumberInput.DecrementTrigger />
    </ChakraNumberInput.Control>
    <ChakraNumberInput.Input {...inputProps} />
  </ChakraNumberInput.Root>
);
