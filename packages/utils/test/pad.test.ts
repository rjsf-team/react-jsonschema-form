import { pad } from '../src';

describe('pad()', () => {
  it('doesn`t pad a string with 0s when unnecessary', () => {
    expect(pad(400, 3)).toEqual('400');
  });
  it('should pad a string with 0s', () => {
    expect(pad(4, 3)).toEqual('004');
  });
});
