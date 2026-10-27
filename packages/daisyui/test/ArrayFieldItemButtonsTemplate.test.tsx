import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { englishStringTranslator, TranslatableString } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

const schema: RJSFSchema = {
  type: 'array',
  title: 'Files',
  items: { type: 'object', properties: { name: { type: 'string' } } },
};
const files = [{ name: 'report.pdf' }, { name: 'invoice.pdf' }];
const BUTTONS = ['move-up', 'move-down', 'copy', 'remove'];

/** A button's title is its accessible name too, since its icon is hidden from assistive technology, so check both */
function expectNames(container: HTMLElement, index: number, names: string[]) {
  BUTTONS.forEach((button, i) => {
    const element = container.querySelectorAll(`.rjsf-array-item-${button}`)[index];
    expect(element).toHaveAttribute('title', names[i]);
    expect(element).toHaveAccessibleName(names[i]);
  });
}

function renderForm(uiSchema: UiSchema, translateString = englishStringTranslator) {
  return render(
    <Form
      schema={schema}
      initialFormData={files}
      uiSchema={uiSchema}
      validator={validator}
      translateString={translateString}
    />,
  );
}

describe('ArrayFieldItemButtonsTemplate', () => {
  test('keeps the default titles and labels when itemLabel is not set', () => {
    const { container } = renderForm({ 'ui:options': { copyable: true } });

    expectNames(container, 0, ['Move up', 'Move down', 'Copy', 'Remove']);
  });

  test('names each item in the titles and labels of its buttons when itemLabel is set', () => {
    const { container } = renderForm({ 'ui:options': { copyable: true, itemLabel: 'name' } });

    expectNames(container, 0, ['Move report.pdf up', 'Move report.pdf down', 'Copy report.pdf', 'Remove report.pdf']);
    expectNames(container, 1, [
      'Move invoice.pdf up',
      'Move invoice.pdf down',
      'Copy invoice.pdf',
      'Remove invoice.pdf',
    ]);
  });

  test('translates the item names', () => {
    const { container } = renderForm({ 'ui:itemLabel': 'name' }, (str, params) =>
      str === TranslatableString.RemoveItemButton ? `Supprimer ${params?.[0]}` : englishStringTranslator(str, params),
    );

    expect(container.querySelector('.rjsf-array-item-remove')).toHaveAccessibleName('Supprimer report.pdf');
  });

  test('keeps each name with its item when the items are reordered', async () => {
    const { container } = renderForm({ 'ui:itemLabel': 'name' });

    await user.click(container.querySelectorAll('.rjsf-array-item-move-down')[0]);

    const removeButtons = container.querySelectorAll('.rjsf-array-item-remove');
    expect(removeButtons[0]).toHaveAccessibleName('Remove invoice.pdf');
    expect(removeButtons[1]).toHaveAccessibleName('Remove report.pdf');
  });
});
