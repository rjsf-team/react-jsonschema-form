import { labelValue } from '../src';

const LABEL = 'label';
const LABEL_NODE = <strong>{LABEL}</strong>;

describe('labelValue', () => {
  it('returns label when hideLabel is unspecified', () => {
    expect(labelValue()).toBeUndefined();
  });
  it('returns label when hideLabel is unspecified', () => {
    expect(labelValue(LABEL)).toBe(LABEL);
  });
  it('returns label when hideLabel is unspecified', () => {
    expect(labelValue(LABEL_NODE)).toBe(LABEL_NODE);
  });
  it('returns label when hideLabel is false', () => {
    expect(labelValue(LABEL, false)).toBe(LABEL);
  });
  it('returns undefined when hideLabel is true', () => {
    expect(labelValue(LABEL, true)).toBeUndefined();
  });
  it('returns fallback false when hideLabel is true', () => {
    expect(labelValue(LABEL, true, false)).toBe(false);
  });
  it('returns fallback "" when hideLabel is true', () => {
    expect(labelValue(LABEL, true, '')).toEqual('');
  });
});
