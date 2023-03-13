import { asNumber } from '../src';

describe('asNumber()', () => {
  it('should return a number out of a string representing a number', () => {
    expect(asNumber('3')).toEqual(3);
  });

  it('should return a float out of a string representing a float', () => {
    expect(asNumber('3.14')).toEqual(3.14);
  });

  it('should return the raw value if the input ends with a dot', () => {
    expect(asNumber('3.')).toEqual('3.');
  });

  it('should not convert the value to an integer if the input ends with a .0', () => {
    // this is to allow users to input 3.07
    expect(asNumber('3.0')).toEqual('3.0');
  });

  it('should not convert the value to an integer if the input ends with a .00', () => {
    // this is to allow users to input 3.107
    expect(asNumber('3.10')).toEqual('3.10');
  });

  it('should allow numbers with a 0 in the first decimal place', () => {
    expect(asNumber('3.07')).toEqual(3.07);
  });

  it('should allow incomplete exponential numbers', () => {
    expect(asNumber('3e')).toEqual('3e');
  });

  it('should allow complete exponential numbers', () => {
    expect(asNumber('3e2')).toEqual(300);
  });

  it('should return undefined if the input is empty', () => {
    expect(asNumber('')).toEqual(undefined);
  });

  it('should return null if the input is null', () => {
    expect(asNumber(null)).toEqual(null);
  });
});
