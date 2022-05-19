/** Returns a string that is padded with "0"s if necessary
 */
export default function pad(num: number, size: number) {
  let s = String(num);
  while (s.length < size) {
    s = '0' + s;
  }
  return s;
}
