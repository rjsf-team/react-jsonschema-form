import { dataURItoBlob } from '../src';

describe('dataURItoBlob()', () => {
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
  it('should return error blob when blob conversion fails', () => {
    const { blob, name } = dataURItoBlob('test.png');
    expect(name).toEqual('test.png');
    expect(blob).toHaveProperty('size', 0);
    expect(blob).toHaveProperty('type', 'The string to be decoded contains invalid characters.');
  });
});
