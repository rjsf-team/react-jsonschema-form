import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  descriptionId,
  getTemplate,
  getUiOptions,
} from '@rjsf/utils';

import { getMantineProps, MaybeWrap } from '../util';
import { Input } from '@mantine/core';

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    children,
    classNames,
    style,
    displayLabel,
    label,
    errors,
    help,
    hidden,
    rawDescription,
    registry,
    schema,
    uiSchema,
    ...otherProps
  } = props;
  const mantineProps = getMantineProps<T, S, F>(otherProps);
  const { wrapLabel, wrapContent } = mantineProps;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions
  );
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions
  );

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      id={id}
      label={label}
      registry={registry}
      schema={schema}
      uiSchema={uiSchema}
      {...otherProps}
    >
      <Input.Wrapper key={id}>
        <MaybeWrap wrap={wrapContent} className='mantine-ui-field-content'>
          {children}
          {displayLabel && rawDescription && (
            <MaybeWrap wrap={wrapLabel} className='mantine-ui-field-label'>
              {rawDescription && (
                <DescriptionFieldTemplate
                  id={descriptionId<T>(id)}
                  description={rawDescription}
                  schema={schema}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              )}
            </MaybeWrap>
          )}
          {help}
          {errors}
        </MaybeWrap>
      </Input.Wrapper>
    </WrapIfAdditionalTemplate>
  );
}
