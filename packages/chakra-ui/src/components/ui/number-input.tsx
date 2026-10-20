import type { ComponentProps } from 'react';
import { useEffect, useRef } from 'react';
import { NumberInput as ChakraNumberInput } from '@chakra-ui/react';

export interface NumberInputProps extends ComponentProps<typeof ChakraNumberInput.Root> {
  /** Its `ref` is left out, since the input's own ref keeps its value in step with `value` */
  inputProps?: Omit<ComponentProps<typeof ChakraNumberInput.Input>, 'ref'>;
}

/**
 * NumberInput component that allows users to input numeric values.
 *
 * @param props - The properties for the number input component.
 * @param [props.children] - The content to display inside the number input.
 * @param [props.inputProps] - Additional props for the input element.
 * @returns The rendered number input component.
 */
export const NumberInputRoot = ({ ref, inputProps, ...props }: NumberInputProps) => {
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
      <ChakraNumberInput.Input ref={inputRef} {...inputProps} />
    </ChakraNumberInput.Root>
  );
};
