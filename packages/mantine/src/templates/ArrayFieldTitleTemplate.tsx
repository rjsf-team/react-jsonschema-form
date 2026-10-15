import { Grid, Title } from '@mantine/core';
import type { ArrayFieldTitleProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getUiOptions, titleId } from '@rjsf/utils';

import { RequiredMarker } from '../utils.tsx';

/** The `ArrayFieldTitleTemplate` component renders the array's title, with the `titleId()` of its `id` on the title's
 * text alone, as `TitleField` does
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { id, title, required, uiSchema, registry, optionalDataControl } = props;

  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { label: displayLabel = true } = options;
  if (!title || !displayLabel) {
    return null;
  }
  let heading = title ? (
    <Title order={4} fw='normal'>
      <span id={titleId(id)}>{title}</span>
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
