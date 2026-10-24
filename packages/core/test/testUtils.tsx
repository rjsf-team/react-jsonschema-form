import type { ComponentType, ReactNode, RefObject } from 'react';
import { Activity, createRef, useEffect, useState } from 'react';
import type { GenericObjectType, ValidatorType, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, fireEvent } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import type { FormRef, FormProps, IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';

export { setupConsoleErrorSuppression, setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';

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

/** The first element `selector` matches in `container`, failing the test when there is none */
export function elementOf(container: ParentNode, selector: string) {
  const element = container.querySelector(selector);
  if (!element) {
    throw new Error(`Nothing matches ${selector}`);
  }
  return element;
}

export function input(container: ParentNode, id: string) {
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

/** What a parent passing `formData` has done so far: the value it currently renders and every edit the form reported.
 * A `vi.fn()` `onChange` records the edit but never hands it back as the next `formData` prop, so a test built on one
 * exercises the form's own data and nothing about composition with a parent. These parents do hand values back, each
 * with a different policy, so a test can state which policy it relies on.
 */
export interface ParentLog<T> {
  value: T | undefined;
  reported: (T | undefined)[];
  /** Every event the form sent, for the errors an edit carried */
  events: IChangeEvent<T>[];
}

export function createParentLog<T>(): ParentLog<T> {
  return { value: undefined, reported: [], events: [] };
}

export type ParentProps<T> = Omit<FormProps<T>, 'validator' | 'formData' | 'onChange'> & {
  initialValue?: T;
  log?: ParentLog<T>;
};

/** Stores every edit as its next value, exactly `setData(event.formData)`, the ordinary React pattern */
export function AcceptingParent<T>({ initialValue, log, ...formProps }: ParentProps<T>) {
  const [value, setValue] = useState(initialValue);
  Object.assign(log ?? {}, { value });
  return (
    <Form<T>
      {...formProps}
      validator={validator}
      // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
      formData={value}
      onChange={(event) => {
        log?.reported.push(event.formData);
        log?.events.push(event);
        setValue(event.formData);
      }}
    />
  );
}

/** Keeps passing its initial value whatever the form reports, the shape of a parent that only listens: the form owns
 * the edits and shows them, and since the value it passes never changes after mount, the form has nothing to warn about
 */
export function ListeningParent<T>({ initialValue, log, ...formProps }: ParentProps<T>) {
  Object.assign(log ?? {}, { value: initialValue });
  return (
    <Form<T>
      {...formProps}
      validator={validator}
      // oxlint-disable-next-line typescript/no-deprecated -- pins the deprecated alias: a `formData` passed after mount is ignored with a warning
      formData={initialValue}
      onChange={(event) => {
        log?.reported.push(event.formData);
        log?.events.push(event);
      }}
    />
  );
}

/** Stores a transformed version of each edit, the shape of a parent that normalizes what it is handed */
export function TransformingParent<T>({
  initialValue,
  log,
  transform,
  ...formProps
}: ParentProps<T> & { transform: (edit: T | undefined) => T | undefined }) {
  const [value, setValue] = useState(initialValue);
  Object.assign(log ?? {}, { value });
  return (
    <Form<T>
      {...formProps}
      validator={validator}
      // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
      formData={value}
      onChange={(event) => {
        log?.reported.push(event.formData);
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

interface FormExtraProps {
  omitExtraData: FormProps['omitExtraData'];
  liveOmit?: FormProps['liveOmit'];
}

/** Runs a group of tests with each combination of `omitExtraData` and `liveOmit` as form props */
export function describeRepeated(title: string, fn: (creatorFn: typeof createFormComponent) => void) {
  const formExtraPropsList: FormExtraProps[] = [
    { omitExtraData: false },
    { omitExtraData: true },
    { omitExtraData: true, liveOmit: 'onChange' },
    { omitExtraData: true, liveOmit: 'onBlur' },
  ];
  describe(title, () => {
    for (const formExtraProps of formExtraPropsList) {
      const createFormComponentFn = (props: NoValFormProps) => createFormComponent({ ...props, ...formExtraProps });
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
  for (const list of node.querySelectorAll('ul.rjsf-error-detail')) {
    result[list.id.replace(/__error$/, '')] = Array.from(list.querySelectorAll('li'), (item) => item.textContent ?? '');
  }
  return result;
}

/** The messages the top or bottom `ErrorList` renders, in order. Assumes the default Bootstrap 3 `ErrorList` markup;
 * with a custom `ErrorListTemplate` it finds no list and returns `[]`.
 */
export function errorListMessages(node: ParentNode): string[] {
  return Array.from(node.querySelectorAll('.rjsf-errors li'), (item) => item.textContent ?? '');
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
