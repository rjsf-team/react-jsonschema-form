import { Grid, Title } from '@mantine/core';
import type { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { RequiredMarker } from '../utils.tsx';

/** The `TitleField` is the template to use to render the title of a field. Its `id` goes on the title's text alone, as
 * an option selector beside a container's options is named by it, and the required marker and the optional data
 * control aren't part of that name
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: TitleFieldProps<T, S, F>) {
  const { id, title, required, optionalDataControl } = props;
  let heading = title ? (
    <Title order={3} fw='normal'>
      <span id={id}>{title}</span>
      {required && <RequiredMarker />}
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
