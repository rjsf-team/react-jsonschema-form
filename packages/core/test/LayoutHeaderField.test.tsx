import { titleId, FieldProps, ID_KEY, IdSchema, Registry, TitleFieldProps } from '@rjsf/utils';
import { render, screen, within } from '@testing-library/react';
import noop from 'lodash/noop';

import templates from '../src/components/templates';
import LayoutHeaderField from '../src/components/fields/LayoutHeaderField';

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
    const { idSchema = {} as IdSchema, schema = {}, name = '', uiSchema = {}, required = false, title } = overrideProps;
    return {
      // required FieldProps stubbed
      autofocus: false,
      disabled: false,
      errorSchema: {},
      formContext: undefined,
      formData: undefined,
      onBlur: noop,
      onChange: noop,
      onFocus: noop,
      readonly: false,
      title,
      required,
      // end required FieldProps
      idSchema,
      schema,
      uiSchema,
      name,
      registry: {
        templates: {
          ...templates(),
          TitleFieldTemplate: TestTitleField,
        },
      } as Registry,
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
    expect(headerField).toHaveAttribute('id', titleId('undefined'));

    // Is required
    const requiredSpan = within(headerField).getByTestId(REQUIRED_ID);
    expect(requiredSpan).toBeInTheDocument();
  });

  test('name is provided, schema has title, idSchema has ID_KEY, not required', () => {
    const props = getProps({
      name: TITLE_BOLD,
      schema: { title: TITLE_NORMAL },
      idSchema: { [ID_KEY]: 'foo' } as IdSchema,
    });
    render(<LayoutHeaderField {...props} />);

    // renders header field and has expected text and id
    const headerField = screen.getByTestId(TEST_ID);
    expect(headerField).toHaveTextContent(TITLE_NORMAL);
    expect(headerField).toHaveAttribute('id', titleId(props.idSchema[ID_KEY]));

    // Is not required
    const requiredSpan = within(headerField).queryByTestId(REQUIRED_ID);
    expect(requiredSpan).not.toBeInTheDocument();
  });

  test('title prop is passed, schema has title, idSchema has ID_KEY, required', () => {
    const props = getProps({
      title: TITLE_BOLD,
      schema: { title: TITLE_NORMAL },
      idSchema: { [ID_KEY]: 'foo' } as IdSchema,
      required: true,
    });
    render(<LayoutHeaderField {...props} />);

    // renders header field and has expected text and id
    const headerField = screen.getByTestId(TEST_ID);
    expect(headerField).toHaveTextContent(TITLE_BOLD);
    expect(headerField).toHaveAttribute('id', titleId(props.idSchema[ID_KEY]));

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
      idSchema: { [ID_KEY]: 'foo' } as IdSchema,
    });
    render(<LayoutHeaderField {...props} />);

    // renders header field and has expected text and no id
    const headerField = screen.getByTestId(TEST_ID);
    expect(headerField).toHaveTextContent(TITLE_BOLD_2);
    expect(headerField).toHaveAttribute('id', titleId(props.idSchema[ID_KEY]));

    // Is not required
    const requiredSpan = within(headerField).queryByTestId(REQUIRED_ID);
    expect(requiredSpan).not.toBeInTheDocument();
  });
});
