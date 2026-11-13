import { memo } from 'react';
import type { IconButtonProps } from '@chakra-ui/react';
import { IconButton } from '@chakra-ui/react';
import type {
  FormContextType,
  IconButtonProps as RJSFIconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

export type ChakraIconButtonProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFIconButtonProps<T, S, F> & Omit<IconButtonProps, 'onClick'>;

function ChakraIconButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ChakraIconButtonProps<T, S, F>) {
  const { icon, iconType, uiSchema, registry, ...otherProps } = props;

  return (
    <IconButton aria-label={props.title} {...otherProps}>
      {icon}
    </IconButton>
  );
}

ChakraIconButton.displayName = 'ChakraIconButton';

export default memo(ChakraIconButton) as typeof ChakraIconButton;
