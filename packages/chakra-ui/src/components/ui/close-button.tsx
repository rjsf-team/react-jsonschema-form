import type { ComponentProps } from 'react';
import { IconButton as ChakraIconButton } from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';

export type CloseButtonProps = ComponentProps<typeof ChakraIconButton>;

/**
 * CloseButton component that renders a button with a close icon.
 *
 * @param props - The properties for the close button component.
 * @param [props.children] - The content to display inside the button.
 * @returns The rendered close button component.
 */
export const CloseButton = ({ ref, ...props }: CloseButtonProps) => (
  <ChakraIconButton variant='ghost' aria-label='Close' ref={ref} {...props}>
    {props.children ?? <LuX />}
  </ChakraIconButton>
);
