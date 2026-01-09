import type { ComponentType } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GenericObjectType, ValidatorType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import Form, { FormProps } from '../src';

export type NoValFormProps = Omit<FormProps, 'validator'>;

// eslint-disable-next-line no-unused-vars
export type RerenderType = (newProps: NoValFormProps, v?: ValidatorType) => void;

export function renderNode(Component: ComponentType<any>, props: GenericObjectType) {
  const { container } = render(<Component {...props} />);
  const node = container.firstElementChild;
  return { node };
}

export function createComponent(Component: ComponentType<FormProps>, theProps: FormProps) {
  const onChange = jest.fn();
  const onError = jest.fn();
  const onSubmit = jest.fn();
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

export function createFormComponent(props: NoValFormProps, v: ValidatorType = validator) {
  return createComponent(Form, { validator: v, ...props });
}

// eslint-disable-next-line no-unused-vars
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

export function submitForm(node: Element) {
  act(() => {
    fireEvent.submit(node);
  });
}

export function getSelectedOptionValue(selectNode: HTMLSelectElement) {
  if (selectNode.type !== 'select-one') {
    throw new Error(`invalid node provided, expected select got ${selectNode.type}`);
  }
  const value = selectNode.value;
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
