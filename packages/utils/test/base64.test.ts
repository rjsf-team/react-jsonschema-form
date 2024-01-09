import { base64 } from '../src';

describe('encode64()', () => {
  it('should successfully encode a ascii character', () => {
    expect(base64.encode('v')).toEqual('dg==');
  });
  it('should successfully encode a Chinese character', () => {
    expect(base64.encode('我')).toEqual('5oiR');
  });
});

describe('decode64()', () => {
  it('should successfully decode a ascii character', () => {
    expect(base64.decode('dg==')).toEqual('v');
  });
  it('should successfully decode a Chinese character', () => {
    expect(base64.decode('5oiR')).toEqual('我');
  });
});
