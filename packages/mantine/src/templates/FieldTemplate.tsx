import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
} from '@rjsf/utils';
import { Box } from '@mantine/core';

export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldTemplateProps<T, S, F>) {
  const { id, classNames, style, label, errors, help, hidden, schema, uiSchema, registry, children, ...otherProps } =
    props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions
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
      {help}
      {errors}
    </WrapIfAdditionalTemplate>
  );
}
