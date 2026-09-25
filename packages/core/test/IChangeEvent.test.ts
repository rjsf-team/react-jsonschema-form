import { expectTypeOf } from 'vitest';

import type { FormState, IChangeEvent } from '../src/index.ts';

type EventKey = Exclude<keyof IChangeEvent, 'status'>;
type Mutable<O> = { -readonly [K in keyof O]: O[K] };

/** The event is declared on its own, so nothing ties it to `FormState` any more. These assertions are what does: the
 * day the two drift apart on a shared member, this file stops compiling, and the drift becomes a deliberate decision
 * with a migration note instead of an accident of reshaping the state.
 */
describe('IChangeEvent', () => {
  it('carries the same members as FormState, with the same types', () => {
    expectTypeOf<EventKey>().toEqualTypeOf<
      'schema' | 'uiSchema' | 'schemaUtils' | 'formData' | 'errors' | 'errorSchema'
    >();
    expectTypeOf<Mutable<Pick<IChangeEvent, EventKey>>>().toExtend<Pick<FormState, EventKey>>();
    expectTypeOf<Pick<FormState, EventKey>>().toExtend<Mutable<Pick<IChangeEvent, EventKey>>>();
    expectTypeOf<IChangeEvent['status']>().toEqualTypeOf<'submitted' | undefined>();
  });

  it('cannot be written into', () => {
    const event = {} as IChangeEvent;
    // @ts-expect-error every member is readonly
    event.formData = {};
    // @ts-expect-error every member is readonly
    event.errors = [];
  });
});
