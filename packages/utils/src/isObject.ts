/** Determines whether a `thing` is an object for the purposes of RSJF. In this case, `thing` is an object if it has
 * the type `object` but is NOT null, an array or a File.
 *
 * @param thing - The thing to check to see whether it is an object
 * @returns - True if it is a non-null, non-array, non-File object
 */
export default function isObject(thing: any) {
  if (typeof File !== 'undefined' && thing instanceof File) {
    return false;
  }
  if (typeof Date !== 'undefined' && thing instanceof Date) {
    return false;
  }
  return typeof thing === 'object' && thing !== null && !Array.isArray(thing);
}
