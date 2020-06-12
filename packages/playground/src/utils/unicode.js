export default {
  encodeToBase64(text) {
    return window.btoa(unescape(encodeURIComponent(text)));
  },

  decodeFromBase64(base64) {
    return decodeURIComponent(escape(window.atob(base64)));
  },
};
