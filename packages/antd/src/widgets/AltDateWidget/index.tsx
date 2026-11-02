import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  DateElement,
  dateElementId,
  getGroupAttributes,
  isPlainObject,
  TranslatableString,
  useAltDateWidgetProps,
} from '@rjsf/utils';
import { Row, Col, Button } from 'antd';
import type { RowProps } from 'antd';

import type { AntdFormContext } from '../../formContext.ts';

type Gutter = Exclude<RowProps['gutter'], readonly unknown[]>;

/** Half of one side of a `rowGutter`, which spaces the date parts, in any form antd's `Row` takes: a number, a CSS length
 * or a value per breakpoint. A numeric string, which `Row` turns into invalid CSS, gives half the default
 *
 * @param gutter - One side of the `rowGutter`
 * @returns - The gutter for the date parts' `Row`
 */
function halfGutter(gutter: Gutter): Gutter {
  if (typeof gutter === 'number' && Number.isFinite(gutter)) {
    return Math.floor(gutter / 2);
  }
  if (typeof gutter === 'string' && gutter.trim() !== '' && Number.isNaN(Number(gutter))) {
    return `calc(${gutter} / 2)`;
  }
  if (isPlainObject(gutter)) {
    return Object.fromEntries(
      Object.entries(gutter).map(([breakpoint, value]) => [
        breakpoint,
        typeof value === 'number' ? Math.floor(value / 2) : value,
      ]),
    );
  }
  return 12;
}

export default function AltDateWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus = false,
    disabled = false,
    id,
    label,
    onBlur,
    onFocus,
    options,
    readonly = false,
    registry,
    presentation,
  } = props;
  const { formContext, translateString } = registry;
  const { rowGutter: contextGutter }: AntdFormContext = formContext;
  const [horizontal, vertical] = Array.isArray(contextGutter)
    ? // antd's `Row` reads a missing side of a pair as 0
      [halfGutter(contextGutter[0] ?? 0), halfGutter(contextGutter[1] ?? 0)]
    : [halfGutter(contextGutter ?? 24), halfGutter(contextGutter ?? 24)];
  const { elements, handleChange, handleClear, handleSetNow, buttonsDisabled } = useAltDateWidgetProps(props);
  // The date parts are a group carrying the field's id, as core's are, named by the template's label, which a `for`
  // can't reach since no part carries that id
  const { group } = getGroupAttributes<T, S, F>({ id, presentation }, 'group');

  return (
    <Row id={id} gutter={[horizontal, vertical]} {...group}>
      {elements.map((elemProps, i) => {
        const elemId = dateElementId(id, elemProps.type);
        return (
          <Col flex='88px' key={elemId}>
            <DateElement
              rootId={id}
              label={label}
              select={handleChange}
              {...elemProps}
              disabled={disabled}
              readonly={readonly}
              registry={registry}
              onBlur={onBlur}
              onFocus={onFocus}
              autofocus={autofocus && i === 0}
              presentation={presentation}
            />
          </Col>
        );
      })}
      {!options.hideNowButton && (
        <Col flex='88px'>
          <Button
            block
            className='btn-now'
            onClick={handleSetNow}
            type='primary'
            disabled={buttonsDisabled || undefined}
          >
            {translateString(TranslatableString.NowLabel)}
          </Button>
        </Col>
      )}
      {!options.hideClearButton && (
        <Col flex='88px'>
          <Button
            block
            className='btn-clear'
            danger
            onClick={handleClear}
            type='primary'
            disabled={buttonsDisabled || undefined}
          >
            {translateString(TranslatableString.ClearLabel)}
          </Button>
        </Col>
      )}
    </Row>
  );
}
