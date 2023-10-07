import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

import { Button } from '@carbon/react';
import { Copy, ArrowDown, ArrowUp, TrashCan } from '@carbon/icons-react';

/** The `CopyButton` is used to render a copy action on a `Form` for elements in an array.
 * @param props - The `IconButtonProps` props
 */
export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      size='sm'
      kind='ghost'
      hasIconOnly
      iconDescription={translateString(TranslatableString.CopyButton)}
      renderIcon={Copy}
      {...props}
    />
  );
}

/** The `MoveDownButton` is used to render a move down action on a `Form` for elements in an array.
 * @param props - The `IconButtonProps` props
 */
export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      size='sm'
      kind='ghost'
      hasIconOnly
      iconDescription={translateString(TranslatableString.MoveDownButton)}
      renderIcon={ArrowDown}
      {...props}
    />
  );
}

/** The `MoveUpButton` is used to render a move up action on a `Form` for elements in an array.
 * @param props - The `IconButtonProps` props
 */
export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      size='sm'
      kind='ghost'
      hasIconOnly
      iconDescription={translateString(TranslatableString.MoveUpButton)}
      renderIcon={ArrowUp}
      {...props}
    />
  );
}

/** The `RemoveButton` is used to render a remove action on a `Form` for both a existing `additionalProperties` element for an object or an existing element in an array.
 * @param props - The `IconButtonProps` props
 */
export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      size='sm'
      kind='danger--ghost'
      // there's a css bug in carbon design
      style={{ paddingRight: 0 }}
      hasIconOnly
      iconDescription={translateString(TranslatableString.RemoveButton)}
      {...props}
      renderIcon={TrashCan}
    />
  );
}
