import toInputValue from './toInputValue.ts';

// https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-floating-point-number
const FLOATING_POINT = /^-?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/;

/** Reports whether a native input of `type` shows the `value` that `toInputValue()` gives it, the gate a clear button
 * follows. A number input shows only a valid floating-point number and blanks anything else, `false` included
 * (https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number)); any other input shows whatever isn't
 * an empty string
 *
 * @param value - The widget's value
 * @param [type] - The input's `type`
 * @returns - True if the input shows a value
 */
export default function inputShowsValue(value: unknown, type?: string): boolean {
  const inputValue = String(toInputValue(value));
  return type === 'number' ? FLOATING_POINT.test(inputValue) : inputValue !== '';
}
