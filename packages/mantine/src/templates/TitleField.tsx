import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Grid, Title } from '@mantine/core';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: TitleFieldProps<T, S, F>,
) {
  const { id, title, optionalDataControl } = props;
  let heading = title ? (
    <Title id={id} order={3} fw='normal'>
      {title}
    </Title>
  ) : null;
  if (optionalDataControl) {
    heading = (
      <Grid>
        <Grid.Col span='auto'>{heading}</Grid.Col>
        <Grid.Col span='content'>{optionalDataControl}</Grid.Col>
      </Grid>
    );
  }
  return heading;
}
