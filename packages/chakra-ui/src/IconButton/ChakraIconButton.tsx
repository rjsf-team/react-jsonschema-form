import { memo } from 'react';
import { IconButton, IconButtonProps } from '@chakra-ui/react';
import { FormContextType, IconButtonProps as RJSFIconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export type ChakraIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = RJSFIconButtonProps<T, S, F> & Omit<IconButtonProps, 'onClick'>;

function ChakraIconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ChakraIconButtonProps<T, S, F>,
) {
  const { icon, iconType, uiSchema, registry, ...otherProps } = props;

  return (
    <IconButton aria-label={props.title!} {...otherProps}>
      {icon}
    </IconButton>
  );
}

ChakraIconButton.displayName = 'ChakraIconButton';

export default memo(ChakraIconButton) as typeof ChakraIconButton;
