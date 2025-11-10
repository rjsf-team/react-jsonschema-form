import {
  getUiOptions,
  titleId,
  ArrayFieldTitleProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Grid, Title } from '@mantine/core';

/** The `ArrayFieldTitleTemplate` component renders a `TitleFieldTemplate` with an `id` derived from
 * the `fieldPathId`.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { fieldPathId, title, uiSchema, registry, optionalDataControl } = props;

  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { label: displayLabel = true } = options;
  if (!title || !displayLabel) {
    return null;
  }
  let heading = title ? (
    <Title id={titleId(fieldPathId)} order={4} fw='normal'>
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
