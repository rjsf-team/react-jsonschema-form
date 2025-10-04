import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Grid, Header } from 'semantic-ui-react';

import { getSemanticProps } from '../util';

const DEFAULT_OPTIONS = {
  inverted: false,
  dividing: true,
};

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  uiSchema,
  optionalDataControl,
}: TitleFieldProps<T, S, F>) {
  const semanticProps = getSemanticProps<T, S, F>({
    uiSchema,
    defaultSchemaProps: DEFAULT_OPTIONS,
  });
  let heading = title ? (
    <Header id={id} {...semanticProps} as='h5'>
      {title}
    </Header>
  ) : null;
  if (optionalDataControl) {
    heading = (
      <Grid colums={2} relaxed>
        <Grid.Column width={14} style={{ paddingRight: 0 }}>
          {heading}
        </Grid.Column>
        <Grid.Column width={2}>{optionalDataControl}</Grid.Column>
      </Grid>
    );
  }

  return heading;
}
