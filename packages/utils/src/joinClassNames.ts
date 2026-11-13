/** Joins the class names of one element into its `className`, leaving out the conditional ones that are `false`,
 * `null`, `undefined` or empty, as in
 * `joinClassNames(classMap.checkboxWrapper, disabled && classMap.disabled)`
 *
 * @param classNames - The class names, each a string or a falsy conditional to leave out
 * @returns - The class names present, space separated, `''` where there are none
 */
export default function joinClassNames(...classNames: (string | false | null | undefined)[]): string {
  return classNames.filter(Boolean).join(' ');
}
