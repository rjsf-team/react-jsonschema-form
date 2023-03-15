import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

import { ArrowUpIcon, ArrowDownIcon, CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import ChakraIconButton from './ChakraIconButton';

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <ChakraIconButton<T, S, F> title={translateString(TranslatableString.CopyButton)} {...props} icon={<CopyIcon />} />
  );
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <ChakraIconButton<T, S, F>
      title={translateString(TranslatableString.MoveDownButton)}
      {...props}
      icon={<ArrowDownIcon />}
    />
  );
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <ChakraIconButton<T, S, F>
      title={translateString(TranslatableString.MoveUpButton)}
      {...props}
      icon={<ArrowUpIcon />}
    />
  );
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <ChakraIconButton<T, S, F>
      title={translateString(TranslatableString.RemoveButton)}
      {...props}
      icon={<DeleteIcon />}
    />
  );
}
