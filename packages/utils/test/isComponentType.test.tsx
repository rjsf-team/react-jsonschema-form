import { Component, forwardRef, lazy, memo } from 'react';

import { isComponentType } from '../src/index.ts';

function FunctionComponent() {
  return <div />;
}

class ClassComponent extends Component {
  render() {
    return <div />;
  }
}

describe('isComponentType()', () => {
  it.each([
    ['a function component', FunctionComponent],
    ['a class component', ClassComponent],
    ['a memo() component', memo(FunctionComponent)],
    ['a forwardRef() component', forwardRef<HTMLDivElement>((_props, ref) => <div ref={ref} />)],
    ['a lazy() component', lazy(async () => ({ default: FunctionComponent }))],
  ])('returns true for %s', (_, value) => {
    expect(isComponentType(value)).toBe(true);
  });

  it.each([
    ['a React element', <FunctionComponent key='element' />],
    ['a plain object', {}],
    ['null', null],
    ['undefined', undefined],
    ['a string', 'FunctionComponent'],
    ['a number', 42],
  ])('returns false for %s', (_, value) => {
    expect(isComponentType(value)).toBe(false);
  });
});
