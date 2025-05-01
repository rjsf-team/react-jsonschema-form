import {
  ArrayFieldItemTemplateType,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
  getTemplate,
} from '@rjsf/utils';
import { Button, Grid, Segment } from 'semantic-ui-react';

import { MaybeWrap } from '../util';

const gridStyle = (vertical: boolean) => ({
  display: 'grid',
  gridTemplateColumns: `1fr ${vertical ? 65 : 150}px`,
});

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const { children, buttonsProps, hasToolbar, uiSchema, registry } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );
  // Pull the semantic props out of the uiOptions that were put in via the ArrayFieldTemplate
  const { horizontalButtons = true, wrapItem = false } = uiOptions.semantic as GenericObjectType;
  return (
    <div className='rjsf-array-item'>
      <MaybeWrap wrap={wrapItem} component={Segment}>
        <Grid style={{ ...gridStyle(!horizontalButtons), alignItems: 'center' }}>
          <Grid.Column width={16} verticalAlign='middle'>
            {children}
          </Grid.Column>
          {hasToolbar && (
            <Grid.Column>
              <Button.Group size='mini' vertical={!horizontalButtons}>
                <ArrayFieldItemButtonsTemplate {...buttonsProps} />
              </Button.Group>
            </Grid.Column>
          )}
        </Grid>
      </MaybeWrap>
    </div>
  );
}
