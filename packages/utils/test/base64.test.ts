import { base64 } from '../src';

describe('base64', () => {
  it('should successfully encode a ascii character', () => {
    expect(base64.encode('v')).toEqual('dg==');
  });
  it('should successfully encode a Chinese character', () => {
    expect(base64.encode('我')).toEqual('5oiR');
  });
  it('should successfully encode ascii characters', () => {
    expect(base64.encode('vs')).toEqual('dnM=');
  });
  it('should successfully encode a Chinese characters', () => {
    expect(base64.encode('我是')).toEqual('5oiR5piv');
  });
  it('should successfully decode a ascii character', () => {
    expect(base64.decode('dg==')).toEqual('v');
  });
  it('should successfully decode a Chinese character', () => {
    expect(base64.decode('5oiR')).toEqual('我');
  });
  it('should successfully decode ascii characters', () => {
    expect(base64.decode('dnM=')).toEqual('vs');
  });
  it('should successfully decode a Chinese characters', () => {
    expect(base64.decode('5oiR5piv')).toEqual('我是');
  });
});

describe('nodejs behavior', () => {
  it('should successfully create a base64 object and encode/decode string in node.js', () => {
    expect(base64.encode('我是')).toEqual('5oiR5piv');
    expect(base64.decode('5oiR5piv')).toEqual('我是');
  });
});

describe('browser behavior', () => {
  // capture the TextEncoder and TextDecoder from the util module and assign them to the global object (for mocking browser environment)
  beforeAll(() => {
    const { TextDecoder } = require('util');
    global.TextDecoder = TextDecoder;

    const { TextEncoder } = require('util');
    global.TextEncoder = TextEncoder;
  });
  // restore the TextEncoder and TextDecoder to undefined
  afterAll(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.TextEncoder = undefined;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.TextDecoder = undefined;
  });
  it('should successfully create a base64 object and encode/decode string in browser', () => {
    expect(base64.encode('我是')).toEqual('5oiR5piv');
    expect(base64.decode('5oiR5piv')).toEqual('我是');
  });
});