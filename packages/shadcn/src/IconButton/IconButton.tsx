import { memo } from 'react';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import type { VariantProps } from 'class-variance-authority';
import { ChevronDown, ChevronUp, Copy, Trash2, X } from 'lucide-react';

import { Button, buttonVariants } from '../components/ui/button';

export type ShadIconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = IconButtonProps<T, S, F> & VariantProps<typeof buttonVariants>;

function IconButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ShadIconButtonProps<T, S, F>,
) {
  const { icon, iconType, className, uiSchema, registry, ...otherProps } = props;
  return (
    <Button size='icon' variant='outline' className={className} {...otherProps} type='button'>
      {icon}
    </Button>
  );
}
const IconButton = memo(IconButtonFn) as typeof IconButtonFn;
export default IconButton;

/** Renders a copy button for RJSF array fields that allows users to duplicate array items.
 * The button includes a copy icon and uses the RJSF translation system for the tooltip text.
 * This is used within ArrayField to provide item duplication functionality.
 *
 * @param props - The RJSF icon button properties, including registry for translations and event handlers
 */
function CopyButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ShadIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon={<Copy className='h-4 w-4' />} />
  );
}
export const CopyButton = memo(CopyButtonFn) as typeof CopyButtonFn;

/** Renders a move down button for RJSF array fields that allows reordering of array items.
 * The button includes a chevron-down icon and uses the RJSF translation system for the tooltip text.
 * This is used within ArrayField to allow moving items to a lower index in the array.
 *
 * @param props - The RJSF icon button properties, including registry for translations and event handlers
 */
function MoveDownButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ShadIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.MoveDownButton)}
      {...props}
      icon={<ChevronDown className='h-4 w-4' />}
    />
  );
}
export const MoveDownButton = memo(MoveDownButtonFn) as typeof MoveDownButtonFn;

/** Renders a move up button for RJSF array fields that allows reordering of array items.
 * The button includes a chevron-up icon and uses the RJSF translation system for the tooltip text.
 * This is used within ArrayField to allow moving items to a higher index in the array.
 *
 * @param props - The RJSF icon button properties, including registry for translations and event handlers
 */
function MoveUpButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ShadIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.MoveUpButton)}
      {...props}
      icon={<ChevronUp className='h-4 w-4' />}
    />
  );
}
export const MoveUpButton = memo(MoveUpButtonFn) as typeof MoveUpButtonFn;

/** Renders a remove button for RJSF array fields that allows deletion of array items.
 * The button includes a trash icon and uses the RJSF translation system for the tooltip text.
 * It has special styling with destructive colors to indicate its dangerous action.
 * This is used within ArrayField to provide item removal functionality.
 *
 * @param props - The RJSF icon button properties, including registry for translations and event handlers
 */
function RemoveButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ShadIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.RemoveButton)}
      {...props}
      className={'border-destructive'}
      icon={<Trash2 className='h-4 w-4 stroke-destructive' />}
    />
  );
}
export const RemoveButton = memo(RemoveButtonFn) as typeof RemoveButtonFn;

function ClearButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ShadIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.ClearButton)} {...props} icon={<X />} />;
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
