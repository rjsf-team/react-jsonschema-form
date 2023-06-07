import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
} from '@rjsf/utils';
import { Form } from 'semantic-ui-react';
import { getSemanticProps, MaybeWrap } from '../util';

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
    description,
    rawDescription,
    registry,
    schema,
    uiSchema,
    ...otherProps
  } = props;
  const semanticProps = getSemanticProps<T, S, F>(otherProps);
  const { wrapLabel, wrapContent } = semanticProps;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
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
      <Form.Group key={id} widths='equal' grouped>
        <MaybeWrap wrap={wrapContent} className='sui-field-content'>
          {children}
          {displayLabel && rawDescription && (
            <MaybeWrap wrap={wrapLabel} className='sui-field-label'>
              {description}
            </MaybeWrap>
          )}
          {help}
          {errors}
        </MaybeWrap>
      </Form.Group>
    </WrapIfAdditionalTemplate>
  );
}
