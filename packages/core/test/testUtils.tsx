import type { ComponentType } from 'react';
import type { GenericObjectType, ValidatorType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import '@testing-library/jest-dom';
import { act, render, fireEvent } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import noop from 'lodash/noop';
import type { Mock, MockInstance } from 'vitest';

import type { FormProps } from '../src';
import Form from '../src';

export type NoValFormProps = Omit<FormProps, 'validator'>;

// oxlint-disable-next-line no-unused-vars
export type RerenderType = (newProps: NoValFormProps, v?: ValidatorType) => void;
export interface FormComponentResult {
  container: HTMLElement;
  node: Element;
  onChange: Mock;
  onError: Mock;
  onSubmit: Mock;
  rerender: RerenderType;
}
export interface ConsoleSuppressionResult {
  readonly consoleSpy: MockInstance;
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
  const { container, rerender } = render(
    <Component onSubmit={onSubmit} onError={onError} onChange={onChange} {...theProps} />,
  );

  const rerenderFunction: RerenderType = (newProps: NoValFormProps, v: ValidatorType = validator) => {
    // For Form components, ensure validator is always passed
    const propsWithValidator: FormProps = { ...newProps, validator: v };
    return rerender(<Component onSubmit={onSubmit} onError={onError} onChange={onChange} {...propsWithValidator} />);
  };
  const node = container.firstElementChild;
  if (!node) {
    throw new Error('node is not defined');
  }

  return { container, node, onChange, onError, onSubmit, rerender: rerenderFunction };
}

export function createFormComponent(props: NoValFormProps, v: ValidatorType = validator): FormComponentResult {
  return createComponent(Form, { validator: v, ...props });
}

// oxlint-disable-next-line no-unused-vars
type CreatorFn = (creatorFn: typeof createFormComponent) => void;

/* Run a group of tests with different combinations of omitExtraData and liveOmit as form props.
 */
export function describeRepeated(title: string, fn: CreatorFn) {
  const formExtraPropsList: { omitExtraData: FormProps['omitExtraData']; liveOmit?: FormProps['liveOmit'] }[] = [
    { omitExtraData: false },
    { omitExtraData: true },
    { omitExtraData: true, liveOmit: true },
    { omitExtraData: true, liveOmit: 'onBlur' },
  ];
  for (const formExtraProps of formExtraPropsList) {
    const createFormComponentFn = (props: NoValFormProps) => createFormComponent({ ...props, ...formExtraProps });
    describe(`${title} ${JSON.stringify(formExtraProps)}`, () => fn(createFormComponentFn));
  }
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
