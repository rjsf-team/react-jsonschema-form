import {
  ArrayFieldItemTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
  getTemplate,
} from '@rjsf/utils';
import { Button, Grid, Segment } from 'semantic-ui-react';

import { getSemanticProps, MaybeWrap } from '../util';

const gridStyle = (vertical: boolean) => ({
  display: 'grid',
  gridTemplateColumns: `1fr ${vertical ? 65 : 150}px`,
});

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldItemTemplateProps` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateProps<T, S, F>) {
  const { children, buttonsProps, hasToolbar, uiSchema, registry, parentUiSchema } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );
  const semanticProps = getSemanticProps<T, S, F>({
    uiSchema: parentUiSchema,
    formContext: registry.formContext,
    defaultSchemaProps: { horizontalButtons: true, wrapItem: false },
  });
  const { horizontalButtons = true, wrapItem = false } = semanticProps;
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
