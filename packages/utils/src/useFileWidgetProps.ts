'use client';

import { useCallback, useMemo } from 'react';

import dataURItoBlob from './dataURItoBlob.ts';

/** The information about files used by a FileWidget */
export interface FileInfoType {
  /** The url of the data containing the file */
  dataURL?: string | null;
  /** The name of the file */
  name: string;
  /** The size of the file */
  size: number;
  /** The type of the file */
  type: string;
}

export interface UseFileWidgetPropsResult {
  /** The list of FileInfoType contained within the FileWidget */
  filesInfo: FileInfoType[];
  /** The callback handler to pass to the onChange of the input */
  handleChange: (files: FileList | File[]) => void | Promise<void>;
  /** The callback handler to pass in order to delete a file, given its index in `filesInfo` */
  handleRemove: (index: number) => void;
}

/** Updated the given `dataUrl` to add the `name` to it
 *
 * @param dataURL - The url description string
 * @param name - The name of the file to add to the dataUrl
 * @returns - The `dataUrl` updated to include the name
 */
function addNameToDataURL(dataURL: string, name: string) {
  return dataURL.replace(';base64', `;name=${encodeURIComponent(name)};base64`);
}

/** Returns a promise that will read the file from the browser and return it as the result of the promise.
 *
 * @param file - The `File` information to read
 * @returns - A promise that resolves to the read file.
 */
async function processFile(file: File): Promise<FileInfoType> {
  const { name, size, type } = file;
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        resolve({
          dataURL: addNameToDataURL(event.target.result, name),
          name,
          size,
          type,
        });
      } else {
        resolve({
          dataURL: null,
          name,
          size,
          type,
        });
      }
    };
    reader.readAsDataURL(file);
  });
}

/** Reads a list of files from the browser, returning the results of the promises of each individual file read.
 *
 * @param files - The list of files to read
 * @returns - The list of read files
 */
async function processFiles(files: FileList | File[]) {
  return Promise.all(Array.from(files).map(processFile));
}

/** Extracts the file information from the items a `FileWidget` value stores, skipping an item that isn't a readable
 * data URL, such as the `null` stored for a file that couldn't be read
 *
 * @param items - The stored items
 * @returns - The `FileInfoType` of each readable item, and the index in `items` each one came from
 */
function extractFileInfo(items: unknown[]): { filesInfo: FileInfoType[]; itemIndexes: number[] } {
  const filesInfo: FileInfoType[] = [];
  const itemIndexes: number[] = [];
  items.forEach((dataURL, index) => {
    if (typeof dataURL !== 'string' || dataURL === '') {
      return;
    }
    try {
      const { blob, name } = dataURItoBlob(dataURL);
      filesInfo.push({ dataURL, name, size: blob.size, type: blob.type });
      itemIndexes.push(index);
    } catch {
      // Invalid dataURI, so just ignore it.
    }
  });
  return { filesInfo, itemIndexes };
}

/** The items a `FileWidget` value stores: the list a multiple value holds, kept as it is so an edit never drops an item
 * it can't read, or a single data URL as a list of one
 *
 * @param value - The current value of the `FileWidget`
 * @returns - The stored items
 */
function storedItems(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return typeof value === 'string' && value !== '' ? [value] : [];
}

/** Hook which encapsulates the logic needed to read and convert a `value` of `File` or `File[]` into the
 * `filesInfo: FileInfoType[]` and the two callback implementations needed to change the list or to remove a
 * `File` from the list. To be used by theme specific `FileWidget` implementations.
 *
 * @param value - The current value of the `FileWidget`
 * @param onChange - The onChange handler for the `FileWidget`
 * @param [multiple=false] - Flag indicating whether the control supports multiple selections
 * @returns - The `UseFileWidgetPropsResult` to be used within a `FileWidget` implementation
 */
export default function useFileWidgetProps(
  value: unknown,
  onChange: (value?: unknown) => void,
  multiple = false,
): UseFileWidgetPropsResult {
  const stored = useMemo(() => storedItems(value), [value]);
  const { filesInfo, itemIndexes } = useMemo(() => extractFileInfo(stored), [stored]);

  const handleChange = useCallback(
    async (files: FileList | File[]) => {
      if (files.length === 0) {
        // An empty selection is a cleared input, not an empty append; `stored.concat()` below would silently keep the
        // existing files
        onChange(multiple ? [] : undefined);
        return;
      }
      const filesInfoEvent = await processFiles(files);
      const newValue = filesInfoEvent.map((fileInfo) => fileInfo.dataURL || null);
      if (multiple) {
        onChange(stored.concat(...newValue));
      } else {
        onChange(newValue[0]);
      }
    },
    [stored, multiple, onChange],
  );
  const handleRemove = useCallback(
    (index: number) => {
      if (multiple) {
        // `index` counts the files shown, which skip the items that aren't readable
        const itemIndex = itemIndexes[index];
        onChange(stored.filter((_, i: number) => i !== itemIndex));
      } else {
        onChange(undefined);
      }
    },
    [stored, itemIndexes, multiple, onChange],
  );

  return { filesInfo, handleChange, handleRemove };
}
