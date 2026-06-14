/** Hashes a string using the algorithm based on Java's hashing function.
 * JS has no built-in hashing function, so rolling our own
 *  based on Java's hashing fn:
 *  http://www.java2s.com/example/nodejs-utility-method/string-hash/hashcode-4dc2b.html
 *
 * @param string - The string for which to get the hash
 * @returns - The resulting hash of the string in hex format
 */
export default function hashString(string: string): string {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    const chr = string.charCodeAt(i);
    // oxlint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + chr;
    // oxlint-disable-next-line no-bitwise
    hash &= hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
