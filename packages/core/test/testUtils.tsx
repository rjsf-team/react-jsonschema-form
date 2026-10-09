import type { ComponentType, ReactNode, RefObject } from 'react';
import { Activity, createRef, useEffect, useState } from 'react';
import type { GenericObjectType, ValidatorType, WidgetProps } from '@rjsf/utils';
import { createSchemaUtils, noop } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, fireEvent } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import type { Mock, MockInstance } from 'vitest';

import type { FormRef, FormProps, IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';

export type NoValFormProps = Omit<FormProps, 'validator'>;

/** A ref for a `Form`, which hands back its `FormRef` */
export function createFormRef<T = unknown>() {
  return createRef<FormRef<T>>();
}

/** The handle a mounted form installed on `ref`, failing the test when the form never installed one */
export function handleOf<T>(ref: RefObject<FormRef<T> | null>): FormRef<T> {
  if (!ref.current) {
    throw new Error('The form has not installed its handle on the ref');
  }
  return ref.current;
}

export function input(container: HTMLElement, id: string) {
  const element = container.querySelector(`#${id}`);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`There is no input #${id}`);
  }
  return element;
}

/** Collects what React reports to `window` while `run` runs: an error thrown from an event handler goes there instead
 * of to the dispatcher
 */
export async function reportedBy(run: () => Promise<void>) {
  const reported: unknown[] = [];
  const report = (event: ErrorEvent) => {
    event.preventDefault();
    reported.push(event.error);
  };
  window.addEventListener('error', report);
  try {
    await run();
  } finally {
    window.removeEventListener('error', report);
  }
  return reported;
}

/** A widget that keeps the `onChange` of each field it renders, and `change()` to call the one of the field with the
 * given id, for a change made outside React's event handling, the way a debounced widget, an autosave timer or a
 * `FileReader` callback makes one
 */
export function createRetainingWidget() {
  const changes = new Map<string, WidgetProps['onChange']>();
  function RetainingWidget({ id, onChange, value }: WidgetProps) {
    useEffect(() => {
      changes.set(id, onChange);
    }, [id, onChange]);
    return <span>{String(value ?? '')}</span>;
  }
  const change = (id: string, value: unknown) => {
    const onChange = changes.get(id);
    if (!onChange) {
      throw new Error(`No retaining widget rendered #${id}`);
    }
    onChange(value, undefined, id);
  };
  return { RetainingWidget, change };
}

/** Runs `run` outside React's `act()` environment, where React schedules an update as it would in a browser instead of
 * flushing it on the spot
 */
export async function outsideAct(run: () => Promise<void>) {
  const actEnvironment: unknown = Reflect.get(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  try {
    await run();
  } finally {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', actEnvironment);
  }
}

/** Calls `first` as a timer fires and `second` a microtask later, the way two reports from outside React's event
 * handling follow each other: no event ends between them, and React has flushed only its synchronous work. A throw
 * from either rejects, so it fails the test at once.
 */
export async function aMicrotaskApart(first: () => void, second: () => void) {
  await new Promise((resolve) => {
    setTimeout(resolve);
  });
  first();
  await Promise.resolve();
  second();
}

/** Renders what `element` returns inside an `<Activity>`. `hide()` and `show()` render it again in that mode, passing
 * their arguments on to `element`, which is called anew each time, as a parent's render calls it
 */
export function renderInActivity<Args extends unknown[]>(element: (...args: Args) => ReactNode, ...initial: Args) {
  const inActivity = (mode: 'visible' | 'hidden', args: Args) => <Activity mode={mode}>{element(...args)}</Activity>;
  const { container, rerender } = render(inActivity('visible', initial));
  return {
    container,
    hide: (...args: Args) => rerender(inActivity('hidden', args)),
    show: (...args: Args) => rerender(inActivity('visible', args)),
  };
}

export type RerenderType = (newProps: NoValFormProps, v?: ValidatorType) => void;
export interface FormComponentResult {
  container: HTMLElement;
  node: Element;
  onChange: Mock;
  onError: Mock;
  onSubmit: Mock;
  rerender: RerenderType;
  unmount: () => void;
  /** The data the form renders, read through its handle; the way to check the defaults a seed was filled with */
  getFormData: () => unknown;
}
export interface ConsoleSuppressionResult {
  readonly consoleSpy: MockInstance;
}

/** What a controlled parent has done so far: the value it currently renders and every proposal the form sent it.
 * A `vi.fn()` `onChange` is not a controlled parent: it records the proposal but never hands it back as the next
 * `formData` prop, so a test built on one exercises the form's own state and nothing about controlled composition.
 * These parents do hand values back, each with a different policy, so a test can state which policy it relies on.
 */
export interface ControlledParentLog<T> {
  value: T | undefined;
  proposals: (T | undefined)[];
  /** Every event the form sent, for the errors a proposal carried */
  events: IChangeEvent<T>[];
}

export function createParentLog<T>(): ControlledParentLog<T> {
  return { value: undefined, proposals: [], events: [] };
}

export type ControlledParentProps<T> = Omit<FormProps<T>, 'validator' | 'formData' | 'onChange'> & {
  initialValue?: T;
  log?: ControlledParentLog<T>;
};

/** Stores every proposal as its next value, exactly `setData(event.formData)`, the ordinary React controlled pattern */
export function AcceptingParent<T>({ initialValue, log, ...formProps }: ControlledParentProps<T>) {
  const [value, setValue] = useState(initialValue);
  Object.assign(log ?? {}, { value });
  return (
    <Form<T>
      {...formProps}
      validator={validator}
      formData={value}
      onChange={(event) => {
        log?.proposals.push(event.formData);
        log?.events.push(event);
        setValue(event.formData);
      }}
    />
  );
}

/** Keeps rendering its initial value whatever the form proposes, the shape of a parent whose validation refused */
export function RejectingParent<T>({ initialValue, log, ...formProps }: ControlledParentProps<T>) {
  Object.assign(log ?? {}, { value: initialValue });
  return (
    <Form<T>
      {...formProps}
      validator={validator}
      formData={initialValue}
      onChange={(event) => {
        log?.proposals.push(event.formData);
        log?.events.push(event);
      }}
    />
  );
}

/** Stores a transformed version of each proposal, the shape of a parent that normalizes what it is handed */
export function TransformingParent<T>({
  initialValue,
  log,
  transform,
  ...formProps
}: ControlledParentProps<T> & { transform: (proposal: T | undefined) => T | undefined }) {
  const [value, setValue] = useState(initialValue);
  Object.assign(log ?? {}, { value });
  return (
    <Form<T>
      {...formProps}
      validator={validator}
      formData={value}
      onChange={(event) => {
        log?.proposals.push(event.formData);
        log?.events.push(event);
        setValue(transform(event.formData));
      }}
    />
  );
}

export function renderNode(Component: ComponentType<any>, props: GenericObjectType) {
  const { container } = render(<Component {...props} />);
  const node = container.firstElementChild;
  return { node };
}

export function createComponent(Component: ComponentType<FormProps>, theProps: FormProps): FormComponentResult {
  const onChange = vi.fn();
  const onError = vi.fn();
  const onSubmit = vi.fn();
  const ref = theProps.ref ?? createFormRef();
  const { container, rerender, unmount } = render(
    <Component onSubmit={onSubmit} onError={onError} onChange={onChange} {...theProps} ref={ref} />,
  );

  const rerenderFunction: RerenderType = (newProps: NoValFormProps, v: ValidatorType = validator) => {
    // For Form components, ensure validator is always passed
    const propsWithValidator: FormProps = { ...newProps, validator: v };
    return rerender(
      <Component onSubmit={onSubmit} onError={onError} onChange={onChange} {...propsWithValidator} ref={ref} />,
    );
  };
  const node = container.firstElementChild;
  if (!node) {
    throw new Error('node is not defined');
  }
  // A callback ref passed in keeps the handle to itself
  const getFormData = () => (typeof ref === 'function' || ref === null ? undefined : ref.current?.getFormData());

  return { container, node, onChange, onError, onSubmit, rerender: rerenderFunction, unmount, getFormData };
}

export function createFormComponent(props: NoValFormProps, v: ValidatorType = validator): FormComponentResult {
  return createComponent(Form, { validator: v, ...props });
}

/** `createFormComponent()` with the data owned by an accepting parent instead of the form: the seed (`formData` or
 * `initialFormData`) is filled with the schema's defaults the way the docs tell a controlled parent to, and every
 * proposal is stored and passed back, exactly `setData(event.formData)`. A `formData` passed to `rerender()` replaces
 * the parent's value. Running a suite through both creators is what checks that the two owners behave alike wherever
 * ownership should make no difference.
 */
function createAcceptingFormComponent(props: NoValFormProps, v: ValidatorType = validator): FormComponentResult {
  return createComponent(AcceptingSeededParent, { validator: v, ...props });
}

function AcceptingSeededParent({ formData, initialFormData, onChange, ...props }: FormProps) {
  const [value, setValue] = useState<unknown>(() => {
    const { schema, uiSchema, defaultFormStateBehavior, customMergeAllOf } = props;
    const schemaUtils = createSchemaUtils(
      { validator: props.validator, defaultFormStateBehavior, customMergeAllOf },
      schema,
    );
    const seeded = schemaUtils.getDefaultFormState(
      schema,
      formData !== undefined ? formData : initialFormData,
      false,
      false,
      uiSchema,
    );
    // A seed without defaults resolves to `undefined`, which would make the form own its data
    return seeded === undefined ? null : seeded;
  });
  const [replaced, setReplaced] = useState(formData);
  if (formData !== replaced) {
    setReplaced(formData);
    setValue(formData);
  }
  return (
    <Form
      {...props}
      formData={value}
      onChange={(event, id) => {
        setValue(event.formData);
        onChange?.(event, id);
      }}
    />
  );
}

interface FormExtraProps {
  omitExtraData: FormProps['omitExtraData'];
  liveOmit?: FormProps['liveOmit'];
}

/** Runs a group of tests once with the form owning its data and once with an accepting parent owning it, for the
 * behavior ownership must not change: validation, errors, submit and the events that report them
 */
export function describeOwnerships(
  title: string,
  fn: (creatorFn: typeof createFormComponent, isControlled: boolean) => void,
) {
  describe(`${title} (self-owned)`, () => fn(createFormComponent, false));
  describe(`${title} (parent-owned)`, () => fn(createAcceptingFormComponent, true));
}

/* Run a group of tests with each combination of omitExtraData and liveOmit as form props, under both owners.
 */
export function describeRepeated(title: string, fn: (creatorFn: typeof createFormComponent) => void) {
  const formExtraPropsList: FormExtraProps[] = [
    { omitExtraData: false },
    { omitExtraData: true },
    { omitExtraData: true, liveOmit: 'onChange' },
    { omitExtraData: true, liveOmit: 'onBlur' },
  ];
  describeOwnerships(title, (create) => {
    for (const formExtraProps of formExtraPropsList) {
      const createFormComponentFn = (props: NoValFormProps) => create({ ...props, ...formExtraProps });
      describe(JSON.stringify(formExtraProps), () => fn(createFormComponentFn));
    }
  });
}

/** The field-level error messages the `FieldErrorTemplate` renders, keyed by the id of the field each list sits under.
 * With the DOM as the witness, a test asserts what the user sees rather than the `Form` instance's state, which a
 * function-component `Form` does not expose.
 */
export function fieldErrorsById(node: ParentNode): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const list of node.querySelectorAll('ul.error-detail')) {
    result[list.id.replace(/__error$/, '')] = Array.from(list.querySelectorAll('li'), (item) => item.textContent ?? '');
  }
  return result;
}

/** The messages the top or bottom `ErrorList` renders, in order. Assumes the default Bootstrap 3 `ErrorList` markup;
 * with a custom `ErrorListTemplate` it finds no list and returns `[]`.
 */
export function errorListMessages(node: ParentNode): string[] {
  return Array.from(node.querySelectorAll('.panel.errors li'), (item) => item.textContent ?? '');
}

export async function submitForm(node: Element, user: UserEvent, forceFireEvent = false) {
  const submitButton = node.querySelector('[type="submit"]');
  if (submitButton && !forceFireEvent) {
    await user.click(submitButton);
  } else {
    // fallback if there isn't a submit button
    fireEvent.submit(node);
  }
}

export function getSelectedOptionValue(selectNode: HTMLSelectElement) {
  if (selectNode.type !== 'select-one') {
    throw new Error(`invalid node provided, expected select got ${selectNode.type}`);
  }
  const { value } = selectNode;
  const options = [...selectNode.options];
  const selectedOptions = options
    .filter((option) => (Array.isArray(value) ? value.includes(option.value) : value === option.value))
    .map((option) => option.text);
  if (!Array.isArray(value)) {
    return selectedOptions[0];
  }
  return selectedOptions;
}

export function expectToHaveBeenCalledWithFormData(mock: any, formData: any, secondValue?: string | true) {
  const secondParam = typeof secondValue === 'boolean' ? expect.objectContaining({ type: 'submit' }) : secondValue;
  if (secondParam !== undefined) {
    expect(mock).toHaveBeenLastCalledWith(expect.objectContaining({ formData }), secondParam);
  } else {
    expect(mock).toHaveBeenLastCalledWith(expect.objectContaining({ formData }));
  }
}

export async function delayPromise(delay = 100) {
  return new Promise((r) => {
    setTimeout(r, delay);
  });
}

export function actWrappedDelayPromise(delay = 100) {
  return act(async () => delayPromise(delay));
}

// React's invokeGuardedCallback (dev mode) re-throws render errors by dispatching a synthetic
// DOM event on a fake node. jsdom catches that throw and calls reportException(), which fires
// an ErrorEvent on window and — if unhandled — forwards it to the virtualConsole, producing
// "Error: ..." lines in vitest's stderr. Calling event.preventDefault() marks the error as
// handled, stopping both the virtualConsole output and any uncaughtException emission.
//
// We also keep a file-level console.error spy so individual tests can assert on React's
// "The above error occurred in the <Component> component" messages without creating per-test
// spies that call mockRestore() — which would silently kill the file-level spy for every
// subsequent test in the file.
//
// Call this once at the top of a test file or describe block (not inside a test).
// The returned object's `consoleSpy` getter is safe to access inside test bodies.
export function setupConsoleErrorSuppression(): ConsoleSuppressionResult {
  let spy: MockInstance;

  function handleWindowError(event: ErrorEvent): void {
    if (event.error instanceof Error) {
      event.preventDefault();
    }
  }

  beforeAll(() => {
    spy = vi.spyOn(console, 'error').mockImplementation(noop);
    window.addEventListener('error', handleWindowError);
  });
  beforeEach(() => {
    spy.mockClear();
  });
  afterAll(() => {
    window.removeEventListener('error', handleWindowError);
    spy.mockRestore();
  });

  return {
    get consoleSpy() {
      return spy;
    },
  };
}

// Companion to setupConsoleErrorSuppression for tests that produce expected console.warn
// output. console.warn calls go directly through the spy (no jsdom/window involvement),
// so no window event listener is needed here.
//
// Call this once at the top of a test file or describe block (not inside a test).
// The returned object's `consoleSpy` getter is safe to access inside test bodies.
export function setupConsoleWarnSuppression(): ConsoleSuppressionResult {
  let spy: MockInstance;

  beforeAll(() => {
    spy = vi.spyOn(console, 'warn').mockImplementation(noop);
  });
  beforeEach(() => {
    spy.mockClear();
  });
  afterAll(() => {
    spy.mockRestore();
  });

  return {
    get consoleSpy() {
      return spy;
    },
  };
}
