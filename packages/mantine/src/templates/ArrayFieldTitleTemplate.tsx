import { Grid, Title } from '@mantine/core';
import type { ArrayFieldTitleProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { titleId } from '@rjsf/utils';

import { RequiredMarker } from '../utils.tsx';

/** The `ArrayFieldTitleTemplate` component renders the array's title, with the `titleId()` of its `id` on the title's
 * text alone, as `TitleField` does. `ArrayField` already leaves `title` empty where `ui:label` turns the heading off,
 * and `ArrayFieldTemplate` places the optional data control from `title` alone, so only `title` decides whether a
 * heading is drawn
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { id, title, required, optionalDataControl } = props;

  if (!title) {
    return null;
  }
  let heading = (
    <Title order={4} fw='normal'>
      <span id={titleId(id)}>{title}</span>
      {required && <RequiredMarker />}
    </Title>
  );
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
