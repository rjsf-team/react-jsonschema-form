/**
 * An object that provides base64 encoding and decoding functions using the utf-8 charset to support the characters outside the latin1 range
 * By default, btoa() and atob() only support the latin1 character range.
 */
const base64 = (function () {
  // If we are in the browser, we can use the built-in TextEncoder and TextDecoder
  // Otherwise, it is assumed that we are in node.js, and we can use the util module's TextEncoder and TextDecoder
  function makeEncoder() {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder();
    } else {
      const { TextEncoder } = require('util');
      return new TextEncoder();
    }
  }

  function makeDecoder() {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder();
    } else {
      const { TextDecoder } = require('util');
      return new TextDecoder();
    }
  }

  return {
    encode(text: string): string {
      return btoa(String.fromCharCode(...makeEncoder().encode(text)));
    },
    decode(text: string): string {
      return makeDecoder().decode(Uint8Array.from(atob(text), (c) => c.charCodeAt(0)));
    },
  };
})();

export default base64;
