/**
 * An object that provides base64 encoding and decoding functions using the utf-8 charset to support the characters outside the latin1 range
 * By default, btoa() and atob() only support the latin1 character range.
 */
const base64 = (function () {
  let textEncoder: any;
  let textDecoder: any;

  // If we are in the browser, we can use the built-in TextEncoder and TextDecoder
  // Otherwise, it is assumed that we are in node.js, and we can use the util module's TextEncoder and TextDecoder
  if (typeof TextEncoder !== 'undefined') {
    textEncoder = new TextEncoder();
  } else {
    const { TextEncoder } = require('util');
    textEncoder = new TextEncoder();
  }

  if (typeof TextDecoder !== 'undefined') {
    textDecoder = new TextDecoder();
  } else {
    const { TextDecoder } = require('util');
    textDecoder = new TextDecoder();
  }

  return {
    encode(text: string): string {
      return btoa(String.fromCharCode(...textEncoder.encode(text)));
    },
    decode(text: string): string {
      return textDecoder.decode(Uint8Array.from(atob(text), (c) => c.charCodeAt(0)));
    },
  };
})();

export default base64;
