import type { ReactNode } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema, GenericObjectType } from '@rjsf/utils';
import {
  getTemplates,
  getUiOptions,
  isWholeValueSelect,
  templateDrawsLabel,
  templateLabelFor,
  templateMarksRequired,
} from '@rjsf/utils';
import { Form } from 'antd';

import stripTrailingColon from '../stripTrailingColon.ts';

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
    label,
    presentation,
    rawDescription,
    registry,
    schema,
    uiSchema,
    hasErrors: hasError,
    // oxlint-disable-next-line typescript/no-deprecated -- keeps the messages of a template rendered by hand without `hasErrors`
    rawErrors,
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

  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);

  if (hidden) {
    return <div className='rjsf-field-hidden'>{children}</div>;
  }

  // The plan already says whether a checkbox draws its own label; the guess by the `checkbox` alias
  // is left for a template rendered without one, so a label the plan gives the template isn't dropped
  const leavesPartsToCheckbox = !presentation && uiOptions.widget === 'checkbox';
  const shownLabel = displayLabel && !leavesPartsToCheckbox ? label : undefined;
  // A control named through `aria-labelledby` points at the plan's label id. It sits on the label's text rather than on
  // the label's column, which holds the `*` and `:` antd draws as generated content, which a browser counts in a name.
  // antd strips a trailing colon from a string label and gives it a `title`, so this does both, as TitleField does. It
  // decides by `formContext.colon` alone, since the `colon` and `layout` an enclosing antd `Form` sets are kept in a
  // context antd doesn't export
  let labelNode: ReactNode = shownLabel;
  if (presentation && shownLabel) {
    const labelText = colon === false ? shownLabel : stripTrailingColon(shownLabel);
    labelNode = (
      <span id={presentation.label.id} title={shownLabel}>
        {labelText}
      </span>
    );
  }

  // check to see if there is rawDescription(string) before using description(ReactNode)
  // to prevent showing a blank description area
  const descriptionNode = rawDescription ? description : undefined;
  // antd draws a tooltip only beside a label, and its popup only while it is open, so the tooltip is rendered from the
  // start, kept hidden, for the description the control's `aria-describedby` names to exist, and a field with no label
  // shows its description below instead. Its icon sits in the label, which names a control through its `for`, so it is
  // hidden from that name. antd's Tooltip turns on the shared tooltip of a `ConfigProvider tooltip={{ unique: true }}`,
  // which renders the popup only while it is open, so it is turned off here
  const inTooltip = descriptionLocation === 'tooltip' && !!shownLabel && !!descriptionNode;
  // Help and errors share antd's only below-field slot, and antd draws an empty explain block for a node that renders
  // nothing, so each one is gated on whether it has anything to say
  const helpNode = rawHelp ? help : undefined;
  const errorNode = hasError || rawErrors?.length ? errors : undefined;
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
        htmlFor={templateLabelFor<T, S, F>(props)}
        label={labelNode}
        labelCol={labelCol}
        required={templateMarksRequired<T, S, F>(props)}
        style={wrapperStyle}
        validateStatus={hasError ? 'error' : undefined}
        wrapperCol={wrapperCol}
        tooltip={
          inTooltip ? { title: descriptionNode, forceRender: true, unique: false, icon: TOOLTIP_ICON } : undefined
        }
        extra={inTooltip ? undefined : descriptionNode}
      >
        {children}
      </Form.Item>
    </WrapIfAdditionalTemplate>
  );
}
