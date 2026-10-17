import { useContext } from 'react';
import type { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Col, Divider, Row, ConfigProvider } from 'antd';
import classNames from 'classnames';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, required, registry, title, optionalDataControl }: TitleFieldProps<T, S, F>) {
  const { formContext } = registry;
  const { colon = true } = formContext;

  let labelChildren = title;
  if (colon && typeof title === 'string' && title.trim() !== '') {
    labelChildren = title.replace(/[：:]\s*$/, '');
  }

  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls('form');
  const labelClassName = classNames({
    [`${prefixCls}-item-required`]: required,
    [`${prefixCls}-item-no-colon`]: !colon,
  });
  // The heading's text carries its `titleId()`, which the control a container's heading names, such as its option
  // selector, points `aria-labelledby` at. It sits inside the label, whose required class draws antd's `*` as generated
  // content, which a browser counts in the name of whatever the label's id names
  let heading = title ? (
    <label className={labelClassName} title={typeof title === 'string' ? title : ''}>
      <span id={id}>{labelChildren}</span>
    </label>
  ) : null;
  if (optionalDataControl) {
    heading = (
      <Row>
        <Col flex='auto'>{heading}</Col>
        <Col flex='none'>{optionalDataControl}</Col>
      </Row>
    );
  }

  return (
    <>
      {heading}
      <Divider size='small' style={{ marginBlock: '1px' /* pull the margin right up against the label */ }} />
    </>
  );
}
