/**
 * Base64 encoding and decoding using the utf-8 charset, to support the characters outside the latin1 range that
 * btoa() and atob() alone don't.
 */
const base64 = {
  encode(text: string): string {
    return btoa(safeFromCharCode(text));
  },
  decode(text: string): string {
    return new TextDecoder().decode(Uint8Array.from(atob(text), (c) => c.charCodeAt(0)));
  },
};

/**
 * This function is a workaround for the fact that the String.fromCharCode method can throw a "Maximum call stack size exceeded" error if you try to pass too many arguments to it at once.
 * This is because String.fromCharCode expects individual character codes as arguments and javascript has a limit on the number of arguments that can be passed to a function.
 */
function safeFromCharCode(text: string): string {
  const codes = new TextEncoder().encode(text);
  const CHUNK_SIZE = 0x9000; // 36864
  let result = '';

  for (let i = 0; i < codes.length; i += CHUNK_SIZE) {
    const chunk = codes.slice(i, i + CHUNK_SIZE);
    result += String.fromCharCode(...chunk);
  }

  return result;
}

export default base64;
