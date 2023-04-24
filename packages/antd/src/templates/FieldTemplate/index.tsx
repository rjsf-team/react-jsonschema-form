import Form from 'antd/lib/form';
import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
  GenericObjectType,
} from '@rjsf/utils';

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };

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
    children,
    classNames,
    style,
    description,
    disabled,
    displayLabel,
    errors,
    formContext,
    help,
    hidden,
    id,
    label,
    onDropPropertyClick,
    onKeyChange,
    rawErrors,
    rawDescription,
    rawHelp,
    readonly,
    registry,
    required,
    schema,
    uiSchema,
  } = props;
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
    descriptionLocation = 'below',
  } = formContext as GenericObjectType;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions
  );

  if (hidden) {
    return <div className='field-hidden'>{children}</div>;
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

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <Form.Item
        colon={colon}
        hasFeedback={schema.type !== 'array' && schema.type !== 'object'}
        help={(!!rawHelp && help) || (rawErrors?.length ? errors : undefined)}
        htmlFor={id}
        label={displayLabel && label}
        labelCol={labelCol}
        required={required}
        style={wrapperStyle}
        validateStatus={rawErrors?.length ? 'error' : undefined}
        wrapperCol={wrapperCol}
        {...descriptionProps}
      >
        {children}
      </Form.Item>
    </WrapIfAdditionalTemplate>
  );
}
