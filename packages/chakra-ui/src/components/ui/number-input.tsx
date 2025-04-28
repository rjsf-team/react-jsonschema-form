import { forwardRef, useEffect, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = props.value || '';
    }
  }, [props.value]);

  return (
    <ChakraNumberInput.Root ref={ref} variant='outline' {...props}>
      <ChakraNumberInput.Control>
        <ChakraNumberInput.IncrementTrigger />
        <ChakraNumberInput.DecrementTrigger />
      </ChakraNumberInput.Control>
      <ChakraNumberInput.Input ref={inputRef} />
    </ChakraNumberInput.Root>
  );
});
