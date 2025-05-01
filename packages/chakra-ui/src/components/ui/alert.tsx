import { forwardRef, ReactElement, ReactNode } from 'react';
import { Alert as ChakraAlert } from '@chakra-ui/react';

import { CloseButton } from './close-button';

/**
 * Alert component that displays a message with an optional icon and close button.
 *
 * @param {AlertProps} props - The properties for the alert component.
 * @param {ReactNode} [props.startElement] - The element to display at the start of the alert.
 * @param {ReactNode} [props.endElement] - The element to display at the end of the alert.
 * @param {ReactNode} [props.title] - The title of the alert.
 * @param {ReactElement} [props.icon] - The icon to display in the alert.
 * @param {boolean} [props.closable] - Whether to show the close button.
 * @param {function} [props.onClose] - The function to call when the close button is clicked.
 *
 * @returns {JSX.Element} The rendered alert component.
 */
export interface AlertProps extends Omit<ChakraAlert.RootProps, 'title'> {
  startElement?: ReactNode;
  endElement?: ReactNode;
  title?: ReactNode;
  icon?: ReactElement;
  closable?: boolean;
  onClose?: () => void;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  const { title, children, icon, closable, onClose, startElement, endElement, ...rest } = props;
  return (
    <ChakraAlert.Root ref={ref} {...rest}>
      {startElement || <ChakraAlert.Indicator>{icon}</ChakraAlert.Indicator>}
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
});
