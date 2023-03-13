import CheckboxesWidget from '../src/CheckboxesWidget';
import renderer from 'react-test-renderer';
import { makeWidgetMockProps } from './helpers/createMocks';

describe('CheckboxesWidget', () => {
  test('simple', () => {
    const tree = renderer
      .create(
        <CheckboxesWidget
          {...makeWidgetMockProps({
            options: {
              enumOptions: [{ label: 'A', value: 'a' }],
            },
          })}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test('inline', () => {
    const tree = renderer
      .create(
        <CheckboxesWidget
          {...makeWidgetMockProps({
            options: {
              enumOptions: [{ label: 'A', value: 'a' }],
              inline: true,
            },
          })}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
