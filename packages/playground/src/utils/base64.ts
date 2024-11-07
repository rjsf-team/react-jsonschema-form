/**
 * An object that provides base64 encoding and decoding functions using the utf-8 charset to support the characters
 * outside the latin1 range. By default, btoa() and atob() only support the latin1 character range.
 *
 * This is built as an on-the-fly executed function to support testing the node vs browser implementations
 */
const base64 = (function () {
  // If we are in the browser, we can use the built-in TextEncoder and TextDecoder
  // Otherwise, it is assumed that we are in node.js, and we can use the util module's TextEncoder and TextDecoder
  return {
    encode(text: string): string {
      let encoder: any;
      if (typeof TextEncoder !== 'undefined') {
        encoder = new TextEncoder();
      } else {
        const { TextEncoder } = require('util');
        encoder = new TextEncoder();
      }
      return btoa(safeFromCharCode(encoder, text));
    },
    decode(text: string): string {
      let decoder: any;
      if (typeof TextDecoder !== 'undefined') {
        decoder = new TextDecoder();
      } else {
        const { TextDecoder } = require('util');
        decoder = new TextDecoder();
      }
      return decoder.decode(Uint8Array.from(atob(text), (c) => c.charCodeAt(0)));
    },
  };
})();

/**
 * This function is a workaround for the fact that the String.fromCharCode method can throw a "Maximum call stack size exceeded" error if you try to pass too many arguments to it at once.
 * This is because String.fromCharCode expects individual character codes as arguments and javascript has a limit on the number of arguments that can be passed to a function.
 */
function safeFromCharCode(encoder: any, text: string): string {
  const codes = encoder.encode(text);
  const CHUNK_SIZE = 0x9000; // 36864
  let result = '';

  for (let i = 0; i < codes.length; i += CHUNK_SIZE) {
    const chunk = codes.slice(i, i + CHUNK_SIZE);
    result += String.fromCharCode(...chunk);
  }

  return result;
}

export default base64;
