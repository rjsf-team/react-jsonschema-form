import { forwardRef, InputHTMLAttributes, Ref } from 'react';
import { RadioGroup as ChakraRadioGroup } from '@chakra-ui/react';

export interface RadioProps extends ChakraRadioGroup.ItemProps {
  rootRef?: Ref<HTMLDivElement>;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

/**
 * Radio component that allows users to select a single option from a set.
 *
 * @param {RadioProps} props - The properties for the radio component.
 * @param {InputHTMLAttributes<HTMLInputElement>} [props.inputProps] - Additional props for the input element.
 * @param {Ref<HTMLDivElement>} [props.rootRef] - Ref for the root element of the radio.
 * @returns {JSX.Element} The rendered radio component.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(props, ref) {
  const { children, inputProps, rootRef, ...rest } = props;
  return (
    <ChakraRadioGroup.Item ref={rootRef} {...rest}>
      <ChakraRadioGroup.ItemHiddenInput ref={ref} {...inputProps} />
      <ChakraRadioGroup.ItemIndicator />
      {children && <ChakraRadioGroup.ItemText>{children}</ChakraRadioGroup.ItemText>}
    </ChakraRadioGroup.Item>
  );
});

export const RadioGroup = ChakraRadioGroup.Root;
