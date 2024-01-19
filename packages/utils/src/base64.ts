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
      return btoa(String.fromCharCode(...encoder.encode(text)));
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

export default base64;
