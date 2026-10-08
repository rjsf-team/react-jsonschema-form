import type { FieldProps, TitleFieldProps } from '@rjsf/utils';
import { noop, ROOT_FIELD_PATH, titleId } from '@rjsf/utils';
import { render, screen, within } from '@testing-library/react';

import LayoutHeaderField from '../src/components/fields/LayoutHeaderField.tsx';
import { getTestRegistry } from '../src/testing.ts';

const TEST_ID = 'test-id';
const REQUIRED_ID = 'required-id';

const TITLE_BOLD = 'test';
const TITLE_BOLD_2 = 'test ui';
const TITLE_NORMAL = 'title';

function TestTitleField(props: TitleFieldProps) {
  const { id, title, required } = props;
  return (
    <div id={id} data-testid={TEST_ID}>
      {title}
      {required && <span data-testid={REQUIRED_ID} />}
    </div>
  );
}

describe('LayoutHeaderField', () => {
  function getProps(overrideProps: Partial<FieldProps> = {}): FieldProps {
    const {
      fieldPath = ROOT_FIELD_PATH,
      id = 'root',
      schema = {},
      name = '',
      uiSchema = {},
      required = false,
      title,
    } = overrideProps;
    return {
      // required FieldProps stubbed
      autofocus: false,
      disabled: false,
      errorSchema: {},
      formData: undefined,
      onBlur: noop,
      onChange: noop,
      onFocus: noop,
      readonly: false,
      title,
      required,
      // end required FieldProps
      fieldPath,
      id,
      schema,
      uiSchema,
      name,
      registry: getTestRegistry(schema, {}, { TitleFieldTemplate: TestTitleField }),
    };
  }

  test('default render with no title is empty render', () => {
    const props = getProps();
    const { container } = render(<LayoutHeaderField {...props} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('name is provided, and it is required', () => {
    const props = getProps({ name: TITLE_BOLD, required: true });
    render(<LayoutHeaderField {...props} />);

    // renders header field and has expected text and no id
    const headerField = screen.getByTestId(TEST_ID);
    expect(headerField).toHaveTextContent(TITLE_BOLD);
    expect(headerField).toHaveAttribute('id', titleId(props.id));

    // Is required
    const requiredSpan = within(headerField).getByTestId(REQUIRED_ID);
    expect(requiredSpan).toBeInTheDocument();
  });

  test('name is provided, schema has title, id is provided, not required', () => {
    const props = getProps({
      name: TITLE_BOLD,
      schema: { title: TITLE_NORMAL },
      id: 'foo',
    });
    render(<LayoutHeaderField {...props} />);

    // renders header field and has expected text and id
    const headerField = screen.getByTestId(TEST_ID);
    expect(headerField).toHaveTextContent(TITLE_NORMAL);
    expect(headerField).toHaveAttribute('id', titleId(props.id));

    // Is not required
    const requiredSpan = within(headerField).queryByTestId(REQUIRED_ID);
    expect(requiredSpan).not.toBeInTheDocument();
  });

  test('title prop is passed, schema has title, id is provided, required', () => {
    const props = getProps({
      title: TITLE_BOLD,
      schema: { title: TITLE_NORMAL },
      id: 'foo',
      required: true,
    });
    render(<LayoutHeaderField {...props} />);

    // renders header field and has expected text and id
    const headerField = screen.getByTestId(TEST_ID);
    expect(headerField).toHaveTextContent(TITLE_BOLD);
    expect(headerField).toHaveAttribute('id', titleId(props.id));

    // Is not required
    const requiredSpan = within(headerField).getByTestId(REQUIRED_ID);
    expect(requiredSpan).toBeInTheDocument();
  });

  test('uiSchema has ui:title, title prop is passed, no id, not required', () => {
    const props = getProps({
      title: TITLE_BOLD,
      uiSchema: {
        'ui:title': TITLE_BOLD_2,
      },
      id: 'foo',
    });
    render(<LayoutHeaderField {...props} />);

    // renders header field and has expected text and no id
    const headerField = screen.getByTestId(TEST_ID);
    expect(headerField).toHaveTextContent(TITLE_BOLD_2);
    expect(headerField).toHaveAttribute('id', titleId(props.id));

    // Is not required
    const requiredSpan = within(headerField).queryByTestId(REQUIRED_ID);
    expect(requiredSpan).not.toBeInTheDocument();
  });
});
