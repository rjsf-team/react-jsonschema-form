import { forwardRef } from 'react';
import { NumberInput as ChakraNumberInput } from '@chakra-ui/react';

export type NumberInputProps = ChakraNumberInput.RootProps;

/**
 * NumberInput component that allows users to input numeric values.
 *
 * @param {NumberInputProps} props - The properties for the number input component.
 * @param {ReactNode} [props.children] - The content to display inside the number input.
 * @returns {JSX.Element} The rendered number input component.
 */
export const NumberInputRoot = forwardRef<HTMLDivElement, NumberInputProps>(function NumberInput(props, ref) {
  const { children, ...rest } = props;
  return (
    <ChakraNumberInput.Root ref={ref} variant='outline' {...rest}>
      {children}
      <ChakraNumberInput.Control>
        <ChakraNumberInput.IncrementTrigger />
        <ChakraNumberInput.DecrementTrigger />
      </ChakraNumberInput.Control>
    </ChakraNumberInput.Root>
  );
});

export const NumberInputField = ChakraNumberInput.Input;
export const NumberInputScrubber = ChakraNumberInput.Scrubber;
export const NumberInputLabel = ChakraNumberInput.Label;
