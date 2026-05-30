import { memo } from 'react';
import { AiOutlineArrowDown } from '@react-icons/all-files/ai/AiOutlineArrowDown';
import { AiOutlineArrowUp } from '@react-icons/all-files/ai/AiOutlineArrowUp';
import { IoIosCopy } from '@react-icons/all-files/io/IoIosCopy';
import { IoIosRemove } from '@react-icons/all-files/io/IoIosRemove';
import { IoMdClose } from '@react-icons/all-files/io/IoMdClose';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import Button, { ButtonProps } from 'react-bootstrap/Button';

export type BootstrapIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = IconButtonProps<T, S, F> & ButtonProps;

function IconButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: BootstrapIconButtonProps<T, S, F>,
) {
  const { icon, iconType, className, uiSchema, registry, ...otherProps } = props;
  return (
    <Button {...otherProps} variant={props.variant || 'light'} size='sm'>
      {icon}
    </Button>
  );
}
const IconButton = memo(IconButtonFn) as typeof IconButtonFn;
export default IconButton;

function CopyButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: BootstrapIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon={<IoIosCopy />} />;
}
export const CopyButton = memo(CopyButtonFn) as typeof CopyButtonFn;

function MoveDownButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: BootstrapIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon={<AiOutlineArrowDown />} />
  );
}
export const MoveDownButton = memo(MoveDownButtonFn) as typeof MoveDownButtonFn;

function MoveUpButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: BootstrapIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon={<AiOutlineArrowUp />} />;
}
export const MoveUpButton = memo(MoveUpButtonFn) as typeof MoveUpButtonFn;

function RemoveButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
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
export const RemoveButton = memo(RemoveButtonFn) as typeof RemoveButtonFn;

function ClearButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: BootstrapIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.ClearButton)} {...props} icon={<IoMdClose />} />;
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
