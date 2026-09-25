import { expectTypeOf } from 'vitest';

import type { EventFormData, FormState, IChangeEvent } from '../src/index.ts';

type EventKey = Exclude<keyof IChangeEvent, 'status'>;
type Mutable<O> = { -readonly [K in keyof O]: O[K] };
/** `formData` is the one deliberate difference: the event narrows it with `EventFormData`, pinned below */
type SharedKey = Exclude<EventKey, 'formData'>;

/** The event is declared on its own, so nothing ties it to `FormState` any more. These assertions are what does: the
 * day the two drift apart on a shared member, this file stops compiling, and the drift becomes a deliberate decision
 * with a migration note instead of an accident of reshaping the state.
 */
describe('IChangeEvent', () => {
  it('carries the same members as FormState, with the same types', () => {
    expectTypeOf<EventKey>().toEqualTypeOf<
      'schema' | 'uiSchema' | 'schemaUtils' | 'formData' | 'errors' | 'errorSchema'
    >();
    expectTypeOf<Mutable<Pick<IChangeEvent, SharedKey>>>().toExtend<Pick<FormState, SharedKey>>();
    expectTypeOf<Pick<FormState, SharedKey>>().toExtend<Mutable<Pick<IChangeEvent, SharedKey>>>();
    expectTypeOf<IChangeEvent<{ a: string }>['formData']>().toEqualTypeOf<
      Exclude<FormState<{ a: string }>['formData'], undefined>
    >();
    expectTypeOf<IChangeEvent<string>['formData']>().toEqualTypeOf<FormState<string>['formData']>();
    expectTypeOf<IChangeEvent['status']>().toEqualTypeOf<'submitted' | undefined>();
  });

  it('types formData as T for an object or array root and adds undefined for a scalar one', () => {
    expectTypeOf<IChangeEvent<{ name: string }>['formData']>().toEqualTypeOf<{ name: string }>();
    expectTypeOf<IChangeEvent<string[]>['formData']>().toEqualTypeOf<string[]>();
    expectTypeOf<IChangeEvent<string>['formData']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<IChangeEvent<{ name: string } | null>['formData']>().toEqualTypeOf<
      { name: string } | null | undefined
    >();
    expectTypeOf<IChangeEvent['formData']>().toEqualTypeOf<unknown>();
    expectTypeOf<EventFormData<{ name: string } | undefined>>().toEqualTypeOf<{ name: string } | undefined>();
  });

  it('cannot be written into', () => {
    const event = {} as IChangeEvent;
    // @ts-expect-error every member is readonly
    event.formData = {};
    // @ts-expect-error every member is readonly
    event.errors = [];
  });
});
