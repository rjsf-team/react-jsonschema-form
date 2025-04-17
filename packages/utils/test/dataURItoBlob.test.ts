import { dataURItoBlob } from '../src';

describe('dataURItoBlob()', () => {
  it('should pass when the data is empty', () => {
    const { blob, name } = dataURItoBlob('data:text/plain;base64,');
    expect(name).toEqual('unknown');
    expect(blob).toHaveProperty('size', 0);
    expect(blob).toHaveProperty('type', 'text/plain');
  });
  it('should pass when the both body and media type are empty', () => {
    const { blob, name } = dataURItoBlob('data:;base64,');
    expect(name).toEqual('unknown');
    expect(blob).toHaveProperty('size', 0);
    expect(blob).toHaveProperty('type', '');
  });
  it('should return the body is empty', () => {
    const { blob, name } = dataURItoBlob('data:application/json;name=test.png;base64,');
    expect(name).toEqual('test.png');
    expect(blob).toHaveProperty('size', 0);
    expect(blob).toHaveProperty('type', 'application/json');
  });
  it('should throw when the body is not a Base64 encoded dataURI', () => {
    expect(() => dataURItoBlob('data:;Hello%20World')).toThrow(new Error('File is invalid: dataURI must be base64'));
    expect(() => dataURItoBlob('data:text/plain;Hello%20World')).toThrow(
      new Error('File is invalid: dataURI must be base64'),
    );
    expect(() => dataURItoBlob('data:Hello%20World')).toThrow(new Error('File is invalid: dataURI must be base64'));
  });
  it('should throw if the body is not a valid dataURI', () => {
    expect(() => dataURItoBlob('Hello%20World')).toThrow(new Error('File is invalid: URI must be a dataURI'));
    expect(() => dataURItoBlob('javascript:alert()')).toThrow(new Error('File is invalid: URI must be a dataURI'));
  });

  it('should throw the body is not valid Base64', () => {
    expect(() => dataURItoBlob('data:text/plain;base64,Hello%20World')).toThrow(
      new Error('File is invalid: The string to be decoded contains invalid characters.'),
    );
    expect(() => dataURItoBlob('data:text/plain;base64,こんにちわ')).toThrow(
      new Error('File is invalid: The string to be decoded contains invalid characters.'),
    );
  });

  it('should return the name of the file if present', () => {
    const { blob, name } = dataURItoBlob('data:image/png;name=test.png;base64,VGVzdC5wbmc=');
    expect(name).toEqual('test.png');
    expect(blob).toHaveProperty('size', 8);
    expect(blob).toHaveProperty('type', 'image/png');
  });
  it('should return the name of the file without encoded characters if present', () => {
    const { blob, name } = dataURItoBlob('data:image/png;name=test%201.png;base64,VGVzdC5wbmc=');
    expect(name).toEqual('test 1.png');
    expect(blob).toHaveProperty('size', 8);
    expect(blob).toHaveProperty('type', 'image/png');
  });
  it('should return unknown if name is not provided', () => {
    const { blob, name } = dataURItoBlob('data:image/png;base64,VGVzdC5wbmc=');
    expect(name).toEqual('unknown');
    expect(blob).toHaveProperty('size', 8);
    expect(blob).toHaveProperty('type', 'image/png');
  });
  it('should return ignore unsupported parameters', () => {
    const { blob, name } = dataURItoBlob('data:image/png;unknown=foobar;name=test.png;base64,VGVzdC5wbmc=');
    expect(name).toEqual('test.png');
    expect(blob).toHaveProperty('size', 8);
    expect(blob).toHaveProperty('type', 'image/png');
  });
});
