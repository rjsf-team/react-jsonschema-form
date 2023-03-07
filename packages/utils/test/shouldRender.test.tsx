import React from 'react';
import { shouldRender } from '../src';

type VoidFunc = () => void;
type MyComponentProps = {
  myProp:
    | number
    | VoidFunc
    | {
        mySubProp: number | VoidFunc;
      };
};

type MyComponentState = {
  myState:
    | number
    | VoidFunc
    | {
        mySubState: number | VoidFunc;
      };
};

describe('shouldRender()', () => {
  describe('single level comparison checks', () => {
    let initial: React.Component<MyComponentProps, MyComponentState>;
    beforeAll(() => {
      initial = {
        props: { myProp: 1 },
        state: { myState: 1 },
      } as React.Component<MyComponentProps, MyComponentState>;
    });

    it('should detect equivalent props and state', () => {
      expect(shouldRender(initial, { myProp: 1 }, { myState: 1 })).toBe(false);
    });

    it('should detect diffing props', () => {
      expect(shouldRender(initial, { myProp: 2 }, { myState: 1 })).toBe(true);
    });

    it('should detect diffing state', () => {
      expect(shouldRender(initial, { myProp: 1 }, { myState: 2 })).toBe(true);
    });

    it('should handle equivalent function prop', () => {
      const fn = () => {};
      initial = {
        props: { myProp: fn },
        state: { myState: 1 },
      } as React.Component<MyComponentProps, MyComponentState>;
      expect(shouldRender(initial, { myProp: fn }, { myState: 1 })).toBe(false);
    });
  });

  describe('nested levels comparison checks', () => {
    let initial: React.Component<MyComponentProps, MyComponentState>;
    beforeAll(() => {
      initial = {
        props: { myProp: { mySubProp: 1 } },
        state: { myState: { mySubState: 1 } },
      } as React.Component<MyComponentProps, MyComponentState>;
    });

    it('should detect equivalent props and state', () => {
      expect(shouldRender(initial, { myProp: { mySubProp: 1 } }, { myState: { mySubState: 1 } })).toBe(false);
    });

    it('should detect diffing props', () => {
      expect(shouldRender(initial, { myProp: { mySubProp: 2 } }, { myState: { mySubState: 1 } })).toBe(true);
    });

    it('should detect diffing state', () => {
      expect(shouldRender(initial, { myProp: { mySubProp: 1 } }, { myState: { mySubState: 2 } })).toBe(true);
    });

    it('should handle equivalent function prop', () => {
      const fn = () => {};
      initial = {
        props: { myProp: { mySubProp: fn } },
        state: { myState: { mySubState: fn } },
      } as React.Component<MyComponentProps, MyComponentState>;
      expect(shouldRender(initial, { myProp: { mySubProp: fn } }, { myState: { mySubState: fn } })).toBe(false);
    });
  });
});
