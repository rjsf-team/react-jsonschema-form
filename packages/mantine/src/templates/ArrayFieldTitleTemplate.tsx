import {
  getUiOptions,
  titleId,
  ArrayFieldTitleProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Title } from '@mantine/core';

/** The `ArrayFieldTitleTemplate` component renders a `TitleFieldTemplate` with an `id` derived from
 * the `idSchema`.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { idSchema, title, uiSchema, registry } = props;

  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { label: displayLabel = true } = options;
  if (!title || !displayLabel) {
    return null;
  }
  return (
    <Title id={titleId<T>(idSchema)} order={4} fw='normal'>
      {title}
    </Title>
  );
}
