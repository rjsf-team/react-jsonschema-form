/** Given the `FileReader.readAsDataURL()` based `dataURI` extracts that data into an actual Blob along with the name
 * of that Blob if provided in the URL. If no name is provided, then the name falls back to `unknown`.
 *
 * @param dataURI - The `DataUrl` potentially containing name and raw data to be converted to a Blob
 * @returns - an object containing a Blob and its name, extracted from the URI
 */
export default function dataURItoBlob(dataURILike: string) {
  // check if is dataURI
  if (dataURILike.indexOf('data:') === -1) {
    throw new Error('File is invalid: URI must be a dataURI');
  }
  const dataURI = dataURILike.slice(5);
  const splitted = dataURI.split(';base64,');
  // check if the dataURI is base64
  if (splitted.length !== 2) {
    throw new Error('File is invalid: dataURI must be base64');
  }
  const [media, base64] = splitted;
  const [mime, ...mediaparams] = media.split(';');
  const type = mime || '';
  const name = decodeURI(
    mediaparams.map((param) => param.split('=')).find(([key]) => key === 'name')?.[1] || 'unknown'
  );

  // Built the Uint8Array Blob parameter from the base64 string.
  try {
    const binary = atob(base64);
    const array = new Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    // Create the blob object
    const blob = new window.Blob([new Uint8Array(array)], { type });

    return { blob, name };
  } catch (error) {
    throw new Error('File is invalid: failed to decode base64');
  }
}
