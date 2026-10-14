import type { ComponentProps } from 'react';
import { NumberInput as ChakraNumberInput } from '@chakra-ui/react';

export type NumberInputProps = ComponentProps<typeof ChakraNumberInput.Root>;

/**
 * NumberInput component that allows users to input numeric values.
 *
 * @param props - The properties for the number input component.
 * @param [props.children] - The content to display inside the number input.
 * @returns The rendered number input component.
 */
export const NumberInputRoot = ({ ref, ...props }: NumberInputProps) => (
  <ChakraNumberInput.Root ref={ref} variant='outline' {...props}>
    <ChakraNumberInput.Control>
      <ChakraNumberInput.IncrementTrigger />
      <ChakraNumberInput.DecrementTrigger />
    </ChakraNumberInput.Control>
    <ChakraNumberInput.Input />
  </ChakraNumberInput.Root>
);
