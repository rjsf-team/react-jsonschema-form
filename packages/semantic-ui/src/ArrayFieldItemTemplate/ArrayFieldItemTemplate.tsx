import {
  ArrayFieldTemplateItemType,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
} from '@rjsf/utils';
import { Button, Grid, Segment } from 'semantic-ui-react';

import { MaybeWrap } from '../util';

const gridStyle = (vertical: boolean) => ({
  display: 'grid',
  gridTemplateColumns: `1fr ${vertical ? 65 : 150}px`,
});

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    disabled,
    hasToolbar,
    hasCopy,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    index,
    onCopyIndexClick,
    onDropIndexClick,
    onReorderClick,
    readonly,
    uiSchema,
    registry,
  } = props;
  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  // Pull the semantic props out of the uiOptions that were put in via the ArrayFieldTemplate
  const { horizontalButtons = true, wrapItem = false } = uiOptions.semantic as GenericObjectType;
  return (
    <div className='array-item'>
      <MaybeWrap wrap={wrapItem} component={Segment}>
        <Grid style={{ ...gridStyle(!horizontalButtons), alignItems: 'center' }}>
          <Grid.Column width={16} verticalAlign='middle'>
            {children}
          </Grid.Column>
          {hasToolbar && (
            <Grid.Column>
              {(hasMoveUp || hasMoveDown || hasRemove) && (
                <Button.Group size='mini' vertical={!horizontalButtons}>
                  {(hasMoveUp || hasMoveDown) && (
                    <MoveUpButton
                      className='array-item-move-up'
                      disabled={disabled || readonly || !hasMoveUp}
                      onClick={onReorderClick(index, index - 1)}
                      uiSchema={uiSchema}
                      registry={registry}
                    />
                  )}
                  {(hasMoveUp || hasMoveDown) && (
                    <MoveDownButton
                      className='array-item-move-down'
                      disabled={disabled || readonly || !hasMoveDown}
                      onClick={onReorderClick(index, index + 1)}
                      uiSchema={uiSchema}
                      registry={registry}
                    />
                  )}
                  {hasCopy && (
                    <CopyButton
                      className='array-item-copy'
                      disabled={disabled || readonly}
                      onClick={onCopyIndexClick(index)}
                      uiSchema={uiSchema}
                      registry={registry}
                    />
                  )}
                  {hasRemove && (
                    <RemoveButton
                      className='array-item-remove'
                      disabled={disabled || readonly}
                      onClick={onDropIndexClick(index)}
                      uiSchema={uiSchema}
                      registry={registry}
                    />
                  )}
                </Button.Group>
              )}
            </Grid.Column>
          )}
        </Grid>
      </MaybeWrap>
    </div>
  );
}
