// The value microsyntaxes of https://html.spec.whatwg.org/multipage/common-microsyntaxes.html, which an input of each
// `type` sanitizes its value to, blanking anything else
const MONTH = '\\d{4,}-(0[1-9]|1[0-2])';
const DATE = `${MONTH}-(0[1-9]|[12]\\d|3[01])`;
const TIME = '([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d(\\.\\d{1,3})?)?';
const SHOWN_VALUE = new Map<string | undefined, RegExp>(
  Object.entries({
    number: '-?(\\d+(\\.\\d+)?|\\.\\d+)([eE][+-]?\\d+)?',
    date: DATE,
    'datetime-local': `${DATE}[T ]${TIME}`,
    month: MONTH,
    time: TIME,
    week: '\\d{4,}-W(0[1-9]|[1-4]\\d|5[0-3])',
  }).map(([type, syntax]) => [type, new RegExp(`^(${syntax})$`)]),
);

/** Reports whether an input with `allowClearTextInputs` offers its clear button: when it shows a value that isn't the
 * number `0`. A `range` input offers none, since it always shows a value and can't show an empty one. A `number`,
 * `date`, `datetime-local`, `month`, `time` or `week` input shows only a value in its type's syntax and blanks anything
 * else, `false` included, read by that syntax alone, so a day past its month's end counts as shown; any other input
 * shows whatever isn't an empty string
 *
 * @param inputValue - The input's `value`, as `toInputValue()` gives it
 * @param [type] - The input's `type`
 * @returns - True if the input offers its clear button
 */
export default function offersClearButton(inputValue: string | number, type?: string): boolean {
  return type !== 'range' && Boolean(inputValue) && (SHOWN_VALUE.get(type)?.test(String(inputValue)) ?? true);
}
