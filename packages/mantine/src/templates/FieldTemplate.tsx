import { Box } from '@mantine/core';
import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
} from '@rjsf/utils';

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    classNames,
    style,
    label,
    errors,
    help,
    displayLabel,
    description,
    rawDescription,
    hidden,
    schema,
    uiSchema,
    registry,
    children,
    ...otherProps
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions,
  );

  if (hidden) {
    return <Box display='none'>{children}</Box>;
  }

  return (
    <WrapIfAdditionalTemplate
      id={id}
      classNames={classNames}
      style={style}
      label={label}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
      {...otherProps}
    >
      {children}
      {errors}
      {help}
    </WrapIfAdditionalTemplate>
  );
}
