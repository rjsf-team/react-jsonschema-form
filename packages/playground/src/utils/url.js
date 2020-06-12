import Unicode from "./unicode";

export function getUrlState() {
  try {
    return JSON.parse(
      Unicode.decodeFromBase64(window.location.hash.replace(/^#/u, ""))
    );
  } catch (err) {
    return null;
  }
}
