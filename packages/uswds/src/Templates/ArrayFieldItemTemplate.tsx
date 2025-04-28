import {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Grid } from '@trussworks/react-uswds';

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    className,
    disabled,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    hasToolbar,
    index,
    onCopyIndexClick,
    onDropIndexClick,
    onReorderClick,
    readonly,
    registry,
  } = props;
  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = registry.templates
    .ButtonTemplates<T, S, F>;

  return (
    <Grid container gap={2} className={className}>
      <Grid col="auto" className="rjsf-uswds-array-item-content">
        {children}
      </Grid>
      {hasToolbar && (
        <Grid col="auto" className="rjsf-uswds-array-item-toolbox">
          {(hasMoveUp || hasMoveDown) && (
            <MoveUpButton
              onClick={() => onReorderClick(index, index - 1)}
              disabled={disabled || readonly}
            />
          )}
          {(hasMoveUp || hasMoveDown) && (
            <MoveDownButton
              onClick={() => onReorderClick(index, index + 1)}
              disabled={disabled || readonly}
            />
          )}
          {registry.formContext?.copyable && (
            <CopyButton onClick={() => onCopyIndexClick(index)} disabled={disabled || readonly} />
          )}
          {hasRemove && (
            <RemoveButton onClick={() => onDropIndexClick(index)} disabled={disabled || readonly} />
          )}
        </Grid>
      )}
    </Grid>
  );
}
