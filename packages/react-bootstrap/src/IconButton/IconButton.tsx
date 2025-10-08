import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import Button, { ButtonProps } from 'react-bootstrap/Button';
import { IoIosCopy } from '@react-icons/all-files/io/IoIosCopy';
import { IoIosRemove } from '@react-icons/all-files/io/IoIosRemove';
import { AiOutlineArrowUp } from '@react-icons/all-files/ai/AiOutlineArrowUp';
import { AiOutlineArrowDown } from '@react-icons/all-files/ai/AiOutlineArrowDown';

export type BootstrapIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = IconButtonProps<T, S, F> & ButtonProps;

export default function IconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: BootstrapIconButtonProps<T, S, F>,
) {
  const { icon, iconType, className, uiSchema, registry, ...otherProps } = props;
  return (
    <Button {...otherProps} variant={props.variant || 'light'} size='sm'>
      {icon}
    </Button>
  );
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: BootstrapIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon={<IoIosCopy />} />;
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: BootstrapIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon={<AiOutlineArrowDown />} />
  );
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: BootstrapIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon={<AiOutlineArrowUp />} />;
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: BootstrapIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.RemoveButton)}
      variant='danger'
      {...props}
      icon={<IoIosRemove />}
    />
  );
}
