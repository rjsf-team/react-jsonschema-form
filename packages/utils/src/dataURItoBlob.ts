/** Given the `FileReader.readAsDataURL()` based `dataURI` extracts that data into an actual Blob along with the name
 * of that Blob if provided in the URL. If no name is provided, then the name falls back to `unknown`.
 *
 * @param dataURI - The `DataUrl` potentially containing name and raw data to be converted to a Blob
 * @returns - an object containing a Blob and its name, extracted from the URI
 */
export default function dataURItoBlob(dataURI: string) {
  // Split metadata from data
  const splitted: string[] = dataURI.split(',');
  // Split params
  const params: string[] = splitted[0].split(';');
  // Get mime-type from params
  const type: string = params[0].replace('data:', '');
  // Filter the name property from params
  const properties = params.filter((param) => {
    return param.split('=')[0] === 'name';
  });
  // Look for the name and use unknown if no name property.
  let name: string;
  if (properties.length !== 1) {
    name = 'unknown';
  } else {
    // Because we filtered out the other property,
    // we only have the name case here, which we decode to make it human-readable
    name = decodeURI(properties[0].split('=')[1]);
  }

  // Built the Uint8Array Blob parameter from the base64 string.
  try {
    const binary = atob(splitted[1]);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    // Create the blob object
    const blob = new window.Blob([new Uint8Array(array)], { type });

    return { blob, name };
  } catch (error) {
    return { blob: { size: 0, type: (error as Error).message }, name: dataURI };
  }
}
