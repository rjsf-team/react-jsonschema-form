import type { ComponentProps, ReactNode } from 'react';
import { Alert as ChakraAlert } from '@chakra-ui/react';

import { CloseButton } from './close-button.tsx';

/**
 * Alert component that displays a message with an optional icon and close button.
 *
 * @param props - The properties for the alert component.
 * @param [props.startElement] - The element to display at the start of the alert.
 * @param [props.endElement] - The element to display at the end of the alert.
 * @param [props.title] - The title of the alert.
 * @param [props.closable] - Whether to show the close button.
 * @param [props.onClose] - The function to call when the close button is clicked.
 *
 * @returns The rendered alert component.
 */
export interface AlertProps extends Omit<ComponentProps<typeof ChakraAlert.Root>, 'title'> {
  startElement?: ReactNode;
  endElement?: ReactNode;
  title?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

export const Alert = ({ title, children, closable, onClose, startElement, endElement, ref, ...rest }: AlertProps) => (
  <ChakraAlert.Root ref={ref} {...rest}>
    {startElement || <ChakraAlert.Indicator />}
    {children ? (
      <ChakraAlert.Content>
        <ChakraAlert.Title>{title}</ChakraAlert.Title>
        <ChakraAlert.Description>{children}</ChakraAlert.Description>
      </ChakraAlert.Content>
    ) : (
      <ChakraAlert.Title flex='1'>{title}</ChakraAlert.Title>
    )}
    {endElement}
    {closable && (
      <CloseButton size='sm' pos='relative' top='-2' insetEnd='-2' alignSelf='flex-start' onClick={onClose} />
    )}
  </ChakraAlert.Root>
);
