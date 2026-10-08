import { TranslatableString } from './enums.ts';
import type { InputPropsType, Registry } from './types.ts';

/** Builds the `title` for the `<input>` described by `inputProps`. A `pattern` that the value fails is reported by the
 * browser as a bare "Please match the requested format", which says nothing on a field that now looks like a plain text
 * box; a `title` is appended to that message, so naming the expected format makes the rejection self-explanatory.
 * `getInputProps()` only sets a `pattern` for the numeric text input a `number`/`integer` field defaults to, and sets
 * the `inputMode` that tells the two apart in the same place.
 *
 * @param inputProps - The `InputPropsType` returned by `getInputProps()`
 * @param translateString - The `translateString` function from the `Registry`, used to localize the title
 * @returns - The `title` string, or undefined when the input has no `pattern` to explain
 */
export default function getNumericInputTitle(
  inputProps: InputPropsType,
  translateString: Registry['translateString'],
): string | undefined {
  if (!inputProps.pattern) {
    return undefined;
  }
  return translateString(
    inputProps.inputMode === 'numeric' ? TranslatableString.IntegerInputTitle : TranslatableString.NumberInputTitle,
  );
}
