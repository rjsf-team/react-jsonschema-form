import React from 'react';

import { shouldRender } from '../src/index.ts';

interface MyComponentProps {
  myProp: number | { mySubProp: number };
}

interface MyComponentState {
  myState: number | { mySubState: number };
}

describe('shouldRender()', () => {
  let initial: React.Component<MyComponentProps, MyComponentState>;
  beforeAll(() => {
    initial = {
      props: { myProp: 1 },
      state: { myState: 1 },
    } as React.Component<MyComponentProps, MyComponentState>;
  });

  it('returns false when props and state are shallow equal', () => {
    expect(shouldRender(initial, { myProp: 1 }, { myState: 1 })).toBe(false);
  });

  it('returns true when props differ', () => {
    expect(shouldRender(initial, { myProp: 2 }, { myState: 1 })).toBe(true);
  });

  it('returns true when state differs', () => {
    expect(shouldRender(initial, { myProp: 1 }, { myState: 2 })).toBe(true);
  });

  it('returns true for equal-but-new nested object references (comparison is shallow)', () => {
    const withObject = {
      props: { myProp: { mySubProp: 1 } },
      state: { myState: 1 },
    } as React.Component<MyComponentProps, MyComponentState>;
    expect(shouldRender(withObject, { myProp: { mySubProp: 1 } }, { myState: 1 })).toBe(true);
  });

  it('returns false when a nested object keeps its reference', () => {
    const sharedObject = { mySubProp: 1 };
    const withObject = {
      props: { myProp: sharedObject },
      state: { myState: 1 },
    } as React.Component<MyComponentProps, MyComponentState>;
    expect(shouldRender(withObject, { myProp: sharedObject }, { myState: 1 })).toBe(false);
  });
});
