import { forwardRef } from 'react';
import type { ButtonProps } from '@chakra-ui/react';
import { IconButton as ChakraIconButton } from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';

export type CloseButtonProps = ButtonProps;

/**
 * CloseButton component that renders a button with a close icon.
 *
 * @param {CloseButtonProps} props - The properties for the close button component.
 * @param {ReactNode} [props.children] - The content to display inside the button.
 * @returns {JSX.Element} The rendered close button component.
 */
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(function CloseButton(props, ref) {
  return (
    <ChakraIconButton variant='ghost' aria-label='Close' ref={ref} {...props}>
      {props.children ?? <LuX />}
    </ChakraIconButton>
  );
});
