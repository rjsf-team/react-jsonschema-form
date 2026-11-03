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

const DEFAULT_ROW_GUTTER = 24;

/** Half of a single gutter value: a number, or a CSS length. An empty value or `null`, which `Row` reads as no gutter,
 * gives none, and a value `Row` can't space, such as a numeric string or `NaN`, gives half the default
 *
 * @param side - The gutter value, the default when undefined
 * @returns - Half of it
 */
function halfSide(side: unknown = DEFAULT_ROW_GUTTER): number | string {
  if (typeof side === 'number' && Number.isFinite(side)) {
    return Math.floor(side / 2);
  }
  if (side === null || (typeof side === 'string' && side.trim() === '')) {
    return 0;
  }
  if (typeof side === 'string' && Number.isNaN(Number(side))) {
    return `calc(${side} / 2)`;
  }
  return Math.floor(DEFAULT_ROW_GUTTER / 2);
}

/** Half of one side of a `rowGutter`, which spaces the date parts, in any form antd's `Row` takes: a value, or a value
 * per breakpoint, where an undefined breakpoint stays undefined so `Row` falls through to the next one
 *
 * @param gutter - One side of the `rowGutter`
 * @returns - The gutter for the date parts' `Row`
 */
function halfGutter(gutter: Gutter): Gutter {
  if (isPlainObject(gutter)) {
    // antd types a breakpoint's gutter as a number, but its `Row` spaces a CSS length there as it does a bare one
    return Object.fromEntries(
      Object.entries(gutter).map(([breakpoint, value]) => [
        breakpoint,
        value === undefined ? undefined : halfSide(value),
      ]),
    );
  }
  return halfSide(gutter);
}

/** The date parts' gutter: half of each side of a `[horizontal, vertical]` pair, or half of a single gutter both ways,
 * though `Row` applies a single gutter horizontally only
 *
 * @param rowGutter - The formContext's `rowGutter`
 * @returns - The `[horizontal, vertical]` gutter for the date parts' `Row`
 */
function datePartsGutter(rowGutter: AntdFormContext['rowGutter']): [Gutter, Gutter] {
  if (Array.isArray(rowGutter)) {
    // antd's `Row` reads a missing side of a pair as 0
    return [halfGutter(rowGutter[0] ?? 0), halfGutter(rowGutter[1] ?? 0)];
  }
  const half = halfGutter(rowGutter);
  return [half, half];
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
  const { rowGutter }: AntdFormContext = formContext;
  const { elements, handleChange, handleClear, handleSetNow, buttonsDisabled } = useAltDateWidgetProps(props);
  // The date parts are a group carrying the field's id, as core's are, named by the template's label, which a `for`
  // can't reach since no part carries that id
  const { group } = getGroupAttributes<T, S, F>({ id, presentation }, 'group');

  return (
    <Row id={id} gutter={datePartsGutter(rowGutter)} {...group}>
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
