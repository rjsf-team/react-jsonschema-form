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

/** daisyui's buttons use their title as their accessible name too, so check both */
function namesOf(container: HTMLElement, index: number) {
  return BUTTONS.map((button) => {
    const element = container.querySelectorAll(`.rjsf-array-item-${button}`)[index];
    return [element.getAttribute('title'), element.getAttribute('aria-label')];
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

    expect(namesOf(container, 0)).toEqual([
      ['Move up', 'Move up'],
      ['Move down', 'Move down'],
      ['Copy', 'Copy'],
      ['Remove', 'Remove'],
    ]);
  });

  test('names each item in the titles and labels of its buttons when itemLabel is set', () => {
    const { container } = renderForm({ 'ui:options': { copyable: true, itemLabel: 'name' } });

    expect(namesOf(container, 0)).toEqual([
      ['Move report.pdf up', 'Move report.pdf up'],
      ['Move report.pdf down', 'Move report.pdf down'],
      ['Copy report.pdf', 'Copy report.pdf'],
      ['Remove report.pdf', 'Remove report.pdf'],
    ]);
    expect(namesOf(container, 1)[3]).toEqual(['Remove invoice.pdf', 'Remove invoice.pdf']);
  });

  test('translates the item names', () => {
    const { container } = renderForm({ 'ui:itemLabel': 'name' }, (str, params) =>
      str === TranslatableString.RemoveItemButton ? `Supprimer ${params?.[0]}` : englishStringTranslator(str, params),
    );

    expect(container.querySelector('.rjsf-array-item-remove')).toHaveAttribute('aria-label', 'Supprimer report.pdf');
  });

  test('keeps each name with its item when the items are reordered', async () => {
    const { container } = renderForm({ 'ui:itemLabel': 'name' });

    await user.click(container.querySelectorAll('.rjsf-array-item-move-down')[0]);

    const removeLabels = [...container.querySelectorAll('.rjsf-array-item-remove')].map((button) =>
      button.getAttribute('aria-label'),
    );
    expect(removeLabels).toEqual(['Remove invoice.pdf', 'Remove report.pdf']);
  });
});
