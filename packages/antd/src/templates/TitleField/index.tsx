import { useContext } from 'react';
import type { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Col, Divider, Row, ConfigProvider } from 'antd';
import classNames from 'classnames';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  required,
  registry,
  title,
  optionalDataControl,
}: TitleFieldProps<T, S, F>) {
  const { formContext } = registry;
  const { colon = true } = formContext;

  let labelChildren = title;
  if (colon && typeof title === 'string' && title.trim() !== '') {
    labelChildren = title.replace(/[：:]\s*$/, '');
  }

  const handleLabelClick = () => {
    if (!id) {
      return;
    }

    const control: HTMLLabelElement | null = document.querySelector(`[id="${id}"]`);
    if (control?.focus) {
      control.focus();
    }
  };

  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls('form');
  const labelClassName = classNames({
    [`${prefixCls}-item-required`]: required,
    [`${prefixCls}-item-no-colon`]: !colon,
  });
  // The antd theme, for some reason, made its labels cause the associated field to get the focus when clicked (which
  // kinda breaks a11y), but since it's built that way we will honor it until we decided to break it in a major release
  // oxlint-disable jsx-a11y/no-noninteractive-element-interactions -- <label> is interactive; oxlint incorrectly flags it
  let heading = title ? (
    <label
      className={labelClassName}
      htmlFor={id}
      onClick={handleLabelClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleLabelClick()}
      title={typeof title === 'string' ? title : ''}
    >
      {labelChildren}
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
