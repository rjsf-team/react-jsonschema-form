import type { ColProps } from 'antd';
import classNames from 'classnames';

import { DEFAULT_LABEL_COL } from '../formContext.ts';
import type { AntdFormContext } from '../formContext.ts';

/** Whether antd builds the class `ant-col-24` from this `span`, which it does for 24 and for the string '24' */
function spansFullRow(span: unknown): boolean {
  return span === 24 || span === '24';
}

/** Whether a breakpoint prop of antd's `Col` is 24 columns wide: antd reads a shorthand breakpoint only as a number and
 * otherwise as an object holding the `span`
 */
function breakpointSpansFullRow(breakpoint: unknown): boolean {
  if (typeof breakpoint === 'number') {
    return spansFullRow(breakpoint);
  }
  return typeof breakpoint === 'object' && breakpoint !== null && spansFullRow((breakpoint as { span?: unknown }).span);
}

/** Gets the class name of the column that holds the heading of an object or an array. The heading starts its column,
 * the side of a field's label above its control, when `labelAlign` says so. Without a `labelAlign`, antd starts the
 * label of a column whose `span` or `xl` is 24 and ends any other, so the heading follows the labels.
 *
 * @param prefixCls - The prefix class name of antd's form
 * @param formContext - The `formContext` of the form
 * @returns - The class name of the heading's column
 */
export default function headingLabelColClassName(prefixCls: string, { labelAlign, labelCol }: AntdFormContext): string {
  const { className, span, xl }: ColProps = labelCol ?? DEFAULT_LABEL_COL;
  const labelClsBasic = `${prefixCls}-item-label`;
  const startAligns = labelAlign
    ? labelAlign === 'left' || labelAlign === 'start'
    : spansFullRow(span) || breakpointSpansFullRow(xl);
  return classNames(labelClsBasic, className, startAligns && `${labelClsBasic}-start ${labelClsBasic}-left`);
}
