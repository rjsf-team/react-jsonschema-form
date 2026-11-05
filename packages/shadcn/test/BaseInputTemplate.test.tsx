import { callerInputPropsTests } from '@rjsf/snapshot-tests';
import { render } from '@testing-library/react';

import BaseInputTemplate from '../src/BaseInputTemplate/index.ts';
import Form from '../src/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

describe('BaseInputTemplate', () => {
  test('keeps the pattern and inputMode extraProps carries on a numeric field', () => {
    const { container } = render(
      <BaseInputTemplate
        {...makeWidgetMockProps({ schema: { type: 'number' } })}
        extraProps={{ pattern: '[0-9]*[.]?[0-9]{0,2}', inputMode: 'tel' }}
      />,
    );

    const input = container.querySelector('input')!;
    expect(input).toHaveAttribute('pattern', '[0-9]*[.]?[0-9]{0,2}');
    expect(input).toHaveAttribute('inputmode', 'tel');
    // The title names the constraint the derived pattern imposes, so it goes when that pattern is replaced
    expect(input).not.toHaveAttribute('title');
  });

  test('keeps a passed accept that extraProps names as undefined', () => {
    const { container } = render(
      <BaseInputTemplate
        {...makeWidgetMockProps({ options: { accept: '.pdf' } })}
        accept='.png'
        extraProps={{ accept: undefined }}
      />,
    );

    expect(container.querySelector('input')).toHaveAttribute('accept', '.png');
  });

  test('puts a multiple extraProps carries on a file input and on no other', () => {
    const { container } = render(
      <>
        <BaseInputTemplate
          {...makeWidgetMockProps({ id: 'file', value: '' })}
          type='file'
          extraProps={{ multiple: true }}
        />
        <BaseInputTemplate {...makeWidgetMockProps({ id: 'email' })} type='email' extraProps={{ multiple: true }} />
      </>,
    );

    expect(container.querySelector('#file')).toHaveAttribute('multiple');
    expect(container.querySelector('#email')).not.toHaveAttribute('multiple');
  });

  test('shows nothing for an object value', () => {
    const { container } = render(
      <BaseInputTemplate {...makeWidgetMockProps({ schema: { type: 'string' }, value: { a: 1 } })} />,
    );

    expect(container.querySelector('input')).toHaveValue('');
  });

  test('titles a numeric field whose derived pattern extraProps leaves alone', () => {
    const { container } = render(
      <BaseInputTemplate {...makeWidgetMockProps({ schema: { type: 'integer' } })} extraProps={{ step: 5 }} />,
    );

    expect(container.querySelector('input')).toHaveAttribute('title', 'Enter a whole number');
  });

  test('puts a data attribute extraProps carries on the input', () => {
    const { container } = render(<BaseInputTemplate {...makeWidgetMockProps()} extraProps={{ 'data-testid': 'x' }} />);

    expect(container.querySelector('input')).toHaveAttribute('data-testid', 'x');
  });

  test('keeps a className extraProps carries beside the className prop', () => {
    const { container } = render(
      <BaseInputTemplate {...makeWidgetMockProps()} className='a' extraProps={{ className: 'w-1/2' }} />,
    );

    expect(container.querySelector('input')).toHaveClass('a', 'w-1/2');
  });

  test("keeps Input's focus ring on an invalid input, so it still shows when it takes keyboard focus", () => {
    const { container } = render(
      // oxlint-disable-next-line typescript/no-deprecated -- a template rendered without a plan reads the deprecated prop
      <BaseInputTemplate {...makeWidgetMockProps({ rawErrors: ['too short'] })} />,
    );

    const input = container.querySelector('input')!;
    expect(input).toHaveClass('border-destructive', 'focus-visible:ring-[3px]');
    expect(input).not.toHaveClass('focus-visible:ring-0');
  });
});

callerInputPropsTests(Form);
