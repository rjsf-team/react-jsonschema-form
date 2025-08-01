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
  describe('default strategy (customDeep)', () => {
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

  describe('always strategy (explicit)', () => {
    let initial: React.Component<MyComponentProps, MyComponentState>;
    beforeAll(() => {
      initial = {
        props: { myProp: 1 },
        state: { myState: 1 },
      } as React.Component<MyComponentProps, MyComponentState>;
    });

    it('should return true even with identical props and state', () => {
      expect(shouldRender(initial, initial.props, initial.state, 'always')).toBe(true);
    });

    it('should return true with different props', () => {
      expect(shouldRender(initial, { myProp: 2 }, { myState: 1 }, 'always')).toBe(true);
    });

    it('should return true with different state', () => {
      expect(shouldRender(initial, { myProp: 1 }, { myState: 2 }, 'always')).toBe(true);
    });
  });

  describe('shallow strategy', () => {
    let initial: React.Component<MyComponentProps, MyComponentState>;
    beforeAll(() => {
      initial = {
        props: { myProp: 1 },
        state: { myState: 1 },
      } as React.Component<MyComponentProps, MyComponentState>;
    });

    it('should use shallow comparison for props and state', () => {
      // Should not re-render when props and state are shallow equal
      expect(shouldRender(initial, { myProp: 1 }, { myState: 1 }, 'shallow')).toBe(false);

      // Should re-render when props differ
      expect(shouldRender(initial, { myProp: 2 }, { myState: 1 }, 'shallow')).toBe(true);

      // Should re-render when state differs
      expect(shouldRender(initial, { myProp: 1 }, { myState: 2 }, 'shallow')).toBe(true);
    });

    it('should re-render for nested object changes (shallow comparison)', () => {
      const obj1 = { mySubProp: 1 };
      const obj2 = { mySubProp: 1 }; // Different reference but same content

      initial = {
        props: { myProp: obj1 },
        state: { myState: 1 },
      } as React.Component<MyComponentProps, MyComponentState>;

      // Different object references should trigger re-render with shallow comparison
      expect(shouldRender(initial, { myProp: obj2 }, { myState: 1 }, 'shallow')).toBe(true);
    });
  });

  describe('customDeep strategy (explicit)', () => {
    let initial: React.Component<MyComponentProps, MyComponentState>;
    beforeAll(() => {
      initial = {
        props: { myProp: { mySubProp: 1 } },
        state: { myState: { mySubState: 1 } },
      } as React.Component<MyComponentProps, MyComponentState>;
    });

    it('should perform deep equality check', () => {
      // Same structure, different references - should not re-render
      expect(shouldRender(initial, { myProp: { mySubProp: 1 } }, { myState: { mySubState: 1 } }, 'customDeep')).toBe(
        false,
      );
    });

    it('should detect deep changes in props', () => {
      expect(shouldRender(initial, { myProp: { mySubProp: 2 } }, { myState: { mySubState: 1 } }, 'customDeep')).toBe(
        true,
      );
    });

    it('should detect deep changes in state', () => {
      expect(shouldRender(initial, { myProp: { mySubProp: 1 } }, { myState: { mySubState: 2 } }, 'customDeep')).toBe(
        true,
      );
    });

    it('should handle arrays correctly', () => {
      const initialWithArray = {
        props: { myProp: [1, 2, 3] },
        state: { myState: ['a', 'b'] },
      } as unknown as React.Component<any, any>;

      // Same array content, different references
      expect(shouldRender(initialWithArray, { myProp: [1, 2, 3] }, { myState: ['a', 'b'] }, 'customDeep')).toBe(false);

      // Different array content
      expect(shouldRender(initialWithArray, { myProp: [1, 2, 4] }, { myState: ['a', 'b'] }, 'customDeep')).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    let initial: React.Component<MyComponentProps, MyComponentState>;
    beforeAll(() => {
      initial = {
        props: { myProp: 1 },
        state: { myState: 1 },
      } as React.Component<MyComponentProps, MyComponentState>;
    });

    it('should default to customDeep when no strategy provided', () => {
      const initialNested = {
        props: { myProp: { mySubProp: 1 } },
        state: { myState: { mySubState: 1 } },
      } as React.Component<MyComponentProps, MyComponentState>;

      // Should behave like customDeep (default)
      expect(shouldRender(initialNested, { myProp: { mySubProp: 1 } }, { myState: { mySubState: 1 } })).toBe(false);
    });

    it('should handle invalid strategy gracefully', () => {
      // TypeScript would catch this, but testing runtime behavior
      expect(shouldRender(initial, { myProp: 1 }, { myState: 1 }, 'invalid' as any)).toBe(false); // Should fall through to customDeep
    });
  });
});
