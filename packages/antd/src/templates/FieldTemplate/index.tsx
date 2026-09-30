import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema, GenericObjectType } from '@rjsf/utils';
import { getTemplates, getUiOptions, hasVisibleErrors, isWholeValueSelect } from '@rjsf/utils';
import { Form } from 'antd';

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    children,
    description,
    displayLabel,
    errors,
    help,
    rawHelp,
    hidden,
    id,
    label,
    rawErrors,
    hideError,
    rawDescription,
    registry,
    required,
    schema,
    uiSchema,
  } = props;
  const { formContext } = registry;
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
    descriptionLocation = 'below',
  } = formContext as GenericObjectType;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const hasError = hasVisibleErrors({ rawErrors, hideError });

  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);

  if (hidden) {
    return <div className='rjsf-field-hidden'>{children}</div>;
  }

  // check to see if there is rawDescription(string) before using description(ReactNode)
  // to prevent showing a blank description area
  const descriptionNode = rawDescription ? description : undefined;
  const descriptionProps: GenericObjectType = {};
  switch (descriptionLocation) {
    case 'tooltip':
      descriptionProps.tooltip = descriptionNode;
      break;
    case 'below':
    default:
      descriptionProps.extra = descriptionNode;
      break;
  }
  const isCheckbox = uiOptions.widget === 'checkbox';
  // Help and errors share antd's only below-field slot, and antd draws an empty explain block for a node that renders
  // nothing, so each one is gated on whether it has anything to say
  const helpNode = rawHelp ? help : undefined;
  const errorNode = hasError ? errors : undefined;
  const explainNode =
    errorNode || helpNode ? (
      <>
        {errorNode}
        {helpNode}
      </>
    ) : undefined;
  return (
    <WrapIfAdditionalTemplate {...props}>
      <Form.Item
        colon={colon}
        hasFeedback={(schema.type !== 'array' && schema.type !== 'object') || isWholeValueSelect<S>(schema)}
        help={explainNode}
        htmlFor={id}
        label={displayLabel && !isCheckbox && label}
        labelCol={labelCol}
        required={required}
        style={wrapperStyle}
        validateStatus={hasError ? 'error' : undefined}
        wrapperCol={wrapperCol}
        {...descriptionProps}
      >
        {children}
      </Form.Item>
    </WrapIfAdditionalTemplate>
  );
}
