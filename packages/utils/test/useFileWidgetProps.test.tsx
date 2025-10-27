import { renderHook, waitFor } from '@testing-library/react';

import { useFileWidgetProps, FileInfoType } from '../src';

const FILE_1_STR = 'data:text/plain;name=file1.txt;base64,';
const FILE_2_STR = 'data:text/plain;name=file2.txt;base64,';
const FILE_3_STR = 'data:text/plain;name=file3.txt;base64,';
const BAD_STR = 'data:text/plain;name=file3.txt;base64,x=';

const FILE_1 = { name: 'file1.txt', size: 0, type: 'text/plain' } as File;
const FILE_2 = { name: 'file2.txt', size: 0, type: 'text/plain' } as File;
const FILE_3 = { name: 'file3.txt', size: 0, type: 'text/plain' } as File;

const FILE_1_INFO: FileInfoType = { dataURL: FILE_1_STR, ...FILE_1 };
const FILE_2_INFO: FileInfoType = { dataURL: FILE_2_STR, ...FILE_2 };
const FILE_3_INFO: FileInfoType = { dataURL: FILE_3_STR, ...FILE_3 };

class MockFileList implements Iterable<File> {
  private items: File[];

  constructor(items: File[]) {
    this.items = items;
  }

  // This method implements the iterable protocol
  public *[Symbol.iterator](): Iterator<File> {
    for (const item of this.items) {
      yield item;
    }
  }

  // Expose the underlying files as a FileList
  get files(): FileList {
    const fileList = {
      length: this.items.length,
      item: (index: number) => this.items[index] || null,
    };
    // Make the FileList iterable for compatibility
    Object.defineProperty(fileList, Symbol.iterator, {
      value: this[Symbol.iterator].bind(this),
      writable: true,
      configurable: true,
    });
    return fileList as unknown as FileList;
  }
}

function toFileList(list: File[]) {
  const dataTransfer = new MockFileList(list);
  return dataTransfer.files;
}

describe('useFileWidgetProps()', () => {
  let onChange: jest.Mock;
  let windowFileReaderSpy: jest.SpyInstance;
  let FN_RESULT: any;
  beforeAll(() => {
    onChange = jest.fn();
    FN_RESULT = { target: { result: 'data:text/plain;base64,' } };
    windowFileReaderSpy = jest.spyOn(window, 'FileReader').mockImplementation(
      () =>
        ({
          // eslint-disable-next-line no-unused-vars
          set onload(fn: (event: any) => void) {
            fn(FN_RESULT);
          },
          readAsDataUrl: jest.fn(),
        }) as unknown as FileReader,
    );
  });
  afterEach(() => {
    onChange.mockClear();
    windowFileReaderSpy.mockClear();
  });
  test('undefined initial value, single, handleChange', async () => {
    const { result } = renderHook(() => useFileWidgetProps(undefined, onChange));
    const { filesInfo, handleChange, handleRemove } = result.current;
    expect(filesInfo).toEqual([]);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleRemove).toBeInstanceOf(Function);
    // Now call handleChange to add a file
    handleChange(toFileList([FILE_1]));
    await waitFor(() => {
      // Expect the onChange handler was called with the converted file
      expect(onChange).toHaveBeenCalledWith(FILE_1_STR);
    });
  });
  test('File initial value, single, handleChange', async () => {
    const { result } = renderHook(() => useFileWidgetProps(FILE_2_STR, onChange));
    const { filesInfo, handleChange, handleRemove } = result.current;
    expect(filesInfo).toEqual([FILE_2_INFO]);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleRemove).toBeInstanceOf(Function);
    // Now call handleChange to add a file
    handleChange(toFileList([FILE_3]));
    await waitFor(() => {
      // Expect the onChange handler was called with the converted file
      expect(onChange).toHaveBeenCalledWith(FILE_3_STR);
    });
  });
  test('File initial value, single, handleRemove', async () => {
    const { result } = renderHook(() => useFileWidgetProps(FILE_2_STR, onChange));
    const { filesInfo, handleChange, handleRemove } = result.current;
    expect(filesInfo).toEqual([FILE_2_INFO]);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleRemove).toBeInstanceOf(Function);
    // Now call handleRemove to remove a file
    handleRemove(0);
    await waitFor(() => {
      // Expect the onChange handler was called with the converted file
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });
  test('undefined initial value, multiple, handleChange', async () => {
    const { result } = renderHook(() => useFileWidgetProps([], onChange, true));
    const { filesInfo, handleChange, handleRemove } = result.current;
    expect(filesInfo).toEqual([]);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleRemove).toBeInstanceOf(Function);
    // Now call handleChange to add a file
    handleChange(toFileList([FILE_1, FILE_3]));
    await waitFor(() => {
      // Expect the onChange handler was called with the converted file
      expect(onChange).toHaveBeenCalledWith([FILE_1_STR, FILE_3_STR]);
    });
  });
  test('File initial value, multiple, handleChange', async () => {
    const { result } = renderHook(() => useFileWidgetProps([FILE_2_STR], onChange, true));
    const { filesInfo, handleChange, handleRemove } = result.current;
    expect(filesInfo).toEqual([FILE_2_INFO]);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleRemove).toBeInstanceOf(Function);
    // Now call handleChange to add a file
    handleChange(toFileList([FILE_3]));
    await waitFor(() => {
      // Expect the onChange handler was called with the converted file
      expect(onChange).toHaveBeenCalledWith([FILE_2_STR, FILE_3_STR]);
    });
  });
  test('File initial value, multiple, handleRemove', async () => {
    const { result } = renderHook(() => useFileWidgetProps([FILE_1_STR, FILE_3_STR], onChange, true));
    const { filesInfo, handleChange, handleRemove } = result.current;
    expect(filesInfo).toEqual([FILE_1_INFO, FILE_3_INFO]);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleRemove).toBeInstanceOf(Function);
    // Now call handleRemove to remove a file
    handleRemove(0);
    await waitFor(() => {
      // Expect the onChange handler was called with the converted file
      expect(onChange).toHaveBeenCalledWith([FILE_3_STR]);
    });
  });
  test('Bad initial value, single, handleChange', async () => {
    const { result } = renderHook(() => useFileWidgetProps(BAD_STR, onChange));
    const { filesInfo, handleChange, handleRemove } = result.current;
    expect(filesInfo).toEqual([]);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleRemove).toBeInstanceOf(Function);
    // Now call handleChange to add a file
    handleChange(toFileList([FILE_3]));
    await waitFor(() => {
      // Expect the onChange handler was called with the converted file
      expect(onChange).toHaveBeenCalledWith(FILE_3_STR);
    });
  });
  test('undefined, single, handleChange, NO dataURL', async () => {
    FN_RESULT = { target: null };
    const { result } = renderHook(() => useFileWidgetProps(undefined, onChange));
    const { filesInfo, handleChange, handleRemove } = result.current;
    expect(filesInfo).toEqual([]);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleRemove).toBeInstanceOf(Function);
    // Now call handleChange to add a file
    handleChange(toFileList([FILE_3]));
    await waitFor(() => {
      // Expect the onChange handler was called with the converted file
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });
});
