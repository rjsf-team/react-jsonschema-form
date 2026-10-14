import { QuestionCircleOutlined } from '@ant-design/icons';
import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema, GenericObjectType } from '@rjsf/utils';
import {
  getTemplates,
  getUiOptions,
  hasTemplateErrors,
  isWholeValueSelect,
  templateDrawsLabel,
  templateMarksRequired,
} from '@rjsf/utils';
import { Form } from 'antd';

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };
const TOOLTIP_ICON = <QuestionCircleOutlined aria-hidden />;

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
    errors,
    help,
    rawHelp,
    hidden,
    id,
    label,
    presentation,
    rawDescription,
    registry,
    schema,
    uiSchema,
  } = props;
  const displayLabel = templateDrawsLabel<T, S, F>(props);
  const { formContext } = registry;
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
    descriptionLocation = 'below',
  } = formContext as GenericObjectType;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const hasError = hasTemplateErrors<T, S, F>(props);

  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);

  if (hidden) {
    return <div className='rjsf-field-hidden'>{children}</div>;
  }

  // The plan already says whether a checkbox draws its own label; the guess by the `checkbox` alias
  // is left for a template rendered without one, so a label the plan gives the template isn't dropped
  const leavesPartsToCheckbox = !presentation && uiOptions.widget === 'checkbox';
  const shownLabel = displayLabel && !leavesPartsToCheckbox ? label : undefined;

  // check to see if there is rawDescription(string) before using description(ReactNode)
  // to prevent showing a blank description area
  const descriptionNode = rawDescription ? description : undefined;
  const descriptionProps: GenericObjectType = {};
  // antd draws a tooltip only beside a label, and its popup only while it is open, so the tooltip is rendered from the
  // start, kept hidden, for the description the control's `aria-describedby` names to exist, and a field with no label
  // shows its description below instead. Its icon sits in the label column a control named through `aria-labelledby`
  // takes its name from, so it is hidden from that name
  if (descriptionLocation === 'tooltip' && shownLabel) {
    descriptionProps.tooltip = descriptionNode && {
      title: descriptionNode,
      forceRender: true,
      icon: TOOLTIP_ICON,
    };
  } else {
    descriptionProps.extra = descriptionNode;
  }
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
        label={shownLabel}
        // antd's label takes no id, so its column carries the one a control labelled through `aria-labelledby` points
        // at, which holds what the label's `for` names the field's own control by. The label stays a string, which antd
        // strips a trailing colon from and gives a `title`
        labelCol={presentation ? { ...labelCol, id: presentation.label.id } : labelCol}
        required={templateMarksRequired<T, S, F>(props)}
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
