import validator from '@rjsf/validator-ajv8';
import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { mockIntersectionObserver } from 'jsdom-testing-mocks';

import Form from '../src/index.ts';
import DateTimeWidget from '../src/widgets/DateTimeWidget/DateTimeWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';
import pinTimeZone from './helpers/pinTimeZone.ts';
import stubViewport, { measureClientRectsFrom, rectAt } from './helpers/stubViewport.ts';

const user = userEvent.setup();
const intersectionObserver = mockIntersectionObserver();

/** Opens the picker from its trigger, the one button that opens a popup — the calendar renders more */
async function openPicker(container: HTMLElement) {
  await user.click(container.querySelector('button[aria-haspopup]')!);
}

/** Picks a day other than the stored one, since closing the picker stores what it holds only where the user chose it.
 * A day cell is a button named by its full date, e.g. "Tuesday, April 12th, 2016"
 */
async function pickTheTwelfth(year = 2016) {
  await user.click(screen.getByRole('button', { name: new RegExp(`12th, ${year}`) }));
}

describe('DateTimeWidget', () => {
  describe('with schema.format = iso-date-time', () => {
    const schema = { type: 'string' as const, format: 'iso-date-time' };

    test('commits the date-time as a naive local string without a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30', onChange, schema })} />,
      );

      await openPicker(container);
      await pickTheTwelfth();
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-12T14:01:30');
    });

    test('parses a stored offset value as the naive wall-clock time instead of converting it to local time', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      await openPicker(container);
      await pickTheTwelfth();
      await user.click(screen.getByText('Done'));

      // The wall-clock time of the stored value, not the local time its offset converts to
      expect(onChange).toHaveBeenCalledWith('2016-04-12T14:01:30');
    });
  });

  describe('with schema.format = date-time', () => {
    const schema = { type: 'string' as const, format: 'date-time' };

    test('still commits the date-time as a UTC ISO string with a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      await openPicker(container);
      await pickTheTwelfth();
      await user.click(screen.getByText('Done'));

      // The instant the picked day and the kept time land on depends on the zone the test runs in; the shape does not
      expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^2016-04-1[12]T\d{2}:\d{2}:30\.000Z$/));
    });

    // A day the user never picked is a day they never asked to store, and the value they arrived with may be one this
    // widget does not write itself — an offset date-time, or one carrying seconds
    test('leaves the stored value alone when the picker is dismissed without a change', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      await openPicker(container);
      await user.click(screen.getByText('Done'));

      expect(onChange).not.toHaveBeenCalled();
    });

    test('leaves an unparsable stored value alone rather than throwing over it', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: 'not-a-date', onChange, schema })} />,
      );

      // React routes an error thrown inside a handler to a window `error` event rather than rejecting the
      // promise user-event returns, so the "instead of throwing" half of this test has to listen for that;
      // awaiting the clicks, or wrapping them in `.resolves.not.toThrow()`, would pass either way
      const onWindowError = vi.fn((event: Event) => event.preventDefault());
      window.addEventListener('error', onWindowError);

      try {
        await openPicker(container);
        await user.click(screen.getByText('Done'));
      } finally {
        window.removeEventListener('error', onWindowError);
      }

      expect(onWindowError).not.toHaveBeenCalled();
      // Dismissing the picker without choosing a day is not a request to throw the stored value away, so the empty
      // value is committed only where there was nothing to lose
      expect(onChange).not.toHaveBeenCalled();
    });

    test('commits the empty value, not an empty string, when there was no date to begin with', async () => {
      const onChange = vi.fn();
      const { container } = render(<DateTimeWidget {...makeWidgetMockProps({ value: '', onChange, schema })} />);

      await openPicker(container);
      await user.click(screen.getByText('Done'));

      // `''` is no more a `date-time` than a mangled one, so committing it would fail the format of the field
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  // An emptied time input parses as `NaN`, which invalidates the whole date. Held in state it throws from the
  // calendar's month caption, so the picker dies mid-edit rather than letting the user finish typing a time
  test('survives the time input being cleared mid-edit', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTimeWidget
        {...makeWidgetMockProps({
          value: '2016-04-05T14:01:30.000Z',
          onChange,
          schema: { type: 'string' as const, format: 'date-time' },
        })}
      />,
    );

    const trigger = container.querySelector('button[aria-haspopup]')!;
    const displayed = trigger.textContent;

    await openPicker(container);
    await user.clear(container.querySelector('input[type=time]')!);
    await user.click(screen.getByText('Done'));

    // The date-time it still holds, not the `Invalid Date` an emptied input parses as
    expect(trigger.textContent).toBe(displayed);
    // A half-typed time the widget could not read is no more a change the user asked to store than not touching it
    expect(onChange).not.toHaveBeenCalled();
  });

  // `widgetMap` resolves `ui:widget: 'date-time'` on any string schema, whatever `format` it declares, so this widget
  // can be asked to fill a field an instant does not satisfy
  test('commits a date for a field whose format is date, and so submits without error', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { when: { type: 'string', format: 'date', title: 'When' } } }}
        uiSchema={{ when: { 'ui:widget': 'date-time' } }}
        validator={validator}
        onSubmit={onSubmit}
        onError={onError}
      />,
    );

    await openPicker(container);
    await pickTheTwelfth(new Date().getFullYear());
    await user.click(screen.getByText('Done'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0].formData.when).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // A `date` carries no time and no zone, so reading it as an instant makes it UTC midnight — the evening before to
  // everyone behind UTC, and the day this picker would then commit back over a value the user only meant to edit the
  // time of
  describe('a stored value that is a date rather than a date-time', () => {
    const dateSchema = { type: 'string' as const, format: 'date' };

    pinTimeZone('America/Los_Angeles');

    test('displays the day it names, at the start of that day', () => {
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2020-05-03', schema: dateSchema })} />,
      );

      expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020 12:00 AM');
    });

    test('keeps that day when the user edits only the time', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2020-05-03', onChange, schema: dateSchema })} />,
      );

      await openPicker(container);
      await user.clear(screen.getByLabelText('Time'));
      await user.type(screen.getByLabelText('Time'), '14:30');
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2020-05-03');
    });
  });

  // Both pickers can be pointed at any `string` field through `ui:widget`, and a consumer's form data can hold whatever
  // it holds: a value one picker displays and the other leaves blank is the same value either way, and the blank one
  // then writes its own day over it at the first pick
  describe('a stored value that is not text', () => {
    pinTimeZone('UTC');

    test.each([
      ['an epoch number', Date.UTC(2020, 4, 3, 14, 30)],
      ['a Date', new Date(Date.UTC(2020, 4, 3, 14, 30))],
    ])('displays the instant %s names', (_, value) => {
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value, schema: { type: 'string', format: 'date-time' } })} />,
      );

      expect(container.querySelector('button[aria-haspopup]')).toHaveTextContent('May 3, 2020 2:30 PM');
    });
  });

  // A field with no title leaves `FieldTemplate` no label to render, so the trigger has neither a name from outside nor
  // contents of its own to be named by
  test('names an untitled field with no value by the translated prompt', () => {
    const { container } = render(<Form schema={{ type: 'string', format: 'date-time' }} validator={validator} />);

    expect(container.querySelector('button[aria-haspopup]')).toHaveAccessibleName('Select a date');
  });

  // A hidden label leaves no label element for the trigger to be named by, so its contents are its whole name:
  // rendering nothing would leave a control that is both blank and unnamed
  test('falls back to the label for its text, and so its name, where the label is hidden', () => {
    const { container } = render(
      <DateTimeWidget
        {...makeWidgetMockProps({
          value: '',
          label: 'When',
          // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated prop a component without a plan reads
          hideLabel: true,
          placeholder: '',
          schema: { type: 'string' as const, format: 'date-time' },
        })}
      />,
    );

    expect(container.querySelector('button[aria-haspopup]')).toHaveAccessibleName('When');
  });

  // Nothing about the picker is read-only in itself, so the trigger is the only place either flag can be honored
  describe.each([
    ['disabled', { disabled: true }],
    ['read-only', { readonly: true }],
  ])('a %s field', (_, flags) => {
    test('cannot be opened, so cannot be committed over', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget
          {...makeWidgetMockProps({
            value: '2016-04-05T14:01:30.000Z',
            onChange,
            schema: { type: 'string' as const, format: 'date-time' },
            ...flags,
          })}
        />,
      );

      await user.click(container.querySelector('button[aria-haspopup]')!);

      expect(screen.queryByText('Done')).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // Escape is the one way out of the popup that does not commit, so the instant the user was trying out has to go too
  test('discards the day Escape closes the picker on', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTimeWidget
        {...makeWidgetMockProps({
          value: '2016-04-05T14:01:30.000Z',
          onChange,
          schema: { type: 'string' as const, format: 'date-time' },
        })}
      />,
    );

    await user.click(container.querySelector('button[aria-haspopup]')!);
    await user.click(screen.getByRole('button', { name: /April 17th, 2016/ }));
    await user.keyboard('{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('button[aria-haspopup]')).not.toHaveTextContent('Apr 17, 2016');
  });

  // A combobox, whose contents, the instant it holds, are its value rather than its name or description
  test('holds the selected date-time as its value', () => {
    const { container } = render(
      <DateTimeWidget
        {...makeWidgetMockProps({
          value: '2016-04-05T14:01:30.000Z',
          label: 'When',
          schema: { type: 'string' as const, format: 'iso-date-time' },
        })}
      />,
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBe(container.querySelector('button[aria-haspopup]'));
    expect(trigger).toHaveTextContent(/Apr 5, 2016/);
    expect(trigger).toHaveAccessibleDescription('');
  });

  test('opens its picker on Down Arrow, moving focus onto the selected day', async () => {
    render(
      <Form
        schema={{ type: 'string', format: 'date-time', title: 'When' }}
        initialFormData='2020-05-03T12:00:00'
        validator={validator}
      />,
    );

    await user.tab();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('combobox', { name: 'When' })).toHaveAttribute('aria-expanded', 'true');
    const grid = within(screen.getByRole('dialog', { name: 'When' })).getByRole('grid');
    expect(grid).toContainElement(document.activeElement as HTMLElement);
    expect(document.activeElement).toHaveTextContent(/^3$/);
  });

  describe('the calendar it places', () => {
    stubViewport();

    /** Renders the widget with its trigger put by hand where jsdom, laying nothing out, leaves it an empty box
     *
     * @param rect - Where the trigger is in the viewport
     * @param [into] - The element to render into, which defaults to one appended to the body
     * @returns - The trigger
     */
    function renderAt(rect: { top: number; left: number }, into?: HTMLElement) {
      const { container } = render(
        <DateTimeWidget
          {...makeWidgetMockProps({ value: '2016-04-05T14:01:30', schema: { type: 'string', format: 'date-time' } })}
        />,
        { container: into },
      );
      const trigger = container.querySelector<HTMLElement>('button[aria-haspopup]')!;
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(rectAt(rect.top, rect.left, 40, 20));
      return trigger;
    }

    /** Gives every element a size, which jsdom, laying nothing out, leaves at zero, until the test ends. Its width is
     * capped by its own `width` style, as the popup's `max-width` caps the popup's at its own
     */
    function sizeElements(width: number, height: number) {
      const widthSpy = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function offsetWidth(
        this: HTMLElement,
      ) {
        return Math.min(width, parseFloat(this.style.width) || width);
      });
      const heightSpy = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height);
      onTestFinished(() => {
        widthSpy.mockRestore();
        heightSpy.mockRestore();
      });
      return heightSpy;
    }

    // Taken to be hidden, as jsdom's own stylesheet hides a popover that the stubbed `showPopover()` doesn't show
    const popup = () => screen.getByRole('dialog', { hidden: true });

    test('below its trigger, inside the right edge of the viewport by its own width', async () => {
      // 40px short of the right edge of the 1024px-wide viewport, with the popup 400px wide, as its 20rem `max-width`
      // makes it under a 20px root font
      const trigger = renderAt({ top: 30, left: 984 });
      sizeElements(400, 0);

      await user.click(trigger);

      // Moved left until its 400px end 20px inside that edge
      expect(popup()).toHaveStyle({ position: 'fixed', top: '55px', left: '604px' });
    });

    test('above its trigger where it would run off the bottom of the viewport', async () => {
      const trigger = renderAt({ top: 680, left: 10 });
      sizeElements(320, 500);

      await user.click(trigger);

      // Its 500px end 5px above the trigger's top, where below it they would end 437px past the viewport's bottom
      expect(popup()).toHaveStyle({ top: '175px', left: '10px' });
    });

    test('as low as it fits whole where it fits neither below nor above its trigger', async () => {
      const trigger = renderAt({ top: 380, left: 10 });
      sizeElements(320, 760);

      await user.click(trigger);

      // Its 760px end at the 768px viewport's bottom, Done included
      expect(popup()).toHaveStyle({ top: '8px' });
    });

    test('no taller than the viewport less a horizontal scrollbar along its bottom', async () => {
      // A 15px scrollbar under the 768px viewport, which `100vh` takes in
      vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(753);
      const trigger = renderAt({ top: 380, left: 10 });
      sizeElements(320, 753);

      await user.click(trigger);

      // Scrolling within the 753px above the scrollbar, from the top, so Done ends where the scrollbar starts
      expect(popup()).toHaveStyle({ top: '0px', maxHeight: '753px' });
    });

    test('again when its own height changes', async () => {
      const trigger = renderAt({ top: 680, left: 10 });
      const height = sizeElements(320, 500);
      await user.click(trigger);
      expect(popup()).toHaveStyle({ top: '175px' });

      // A month with one more week grows it a row, which moves no trigger and fires no scroll
      height.mockReturnValue(532);
      await new Promise(requestAnimationFrame);

      expect(popup()).toHaveStyle({ top: '143px' });
    });

    test('writing nothing once placed where its trigger is at a fractional offset', async () => {
      // Off the 1/64px grid the browser snaps the popup's own `top` and `left` to
      const trigger = renderAt({ top: 30.37, left: 10.37 });
      await user.click(trigger);
      await new Promise(requestAnimationFrame);
      const placed = { top: popup().style.top, left: popup().style.left };
      expect(parseFloat(placed.top)).toBeCloseTo(55.37);
      expect(parseFloat(placed.left)).toBeCloseTo(10.37);

      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);

      expect({ top: popup().style.top, left: popup().style.left }).toEqual(placed);
    });

    test.each([2, 1.5])('below its trigger, and staying there, under `zoom: %s` on an ancestor', async (zoom) => {
      // Which draws the popup at that multiple of its own `top`, `left` and size, and measures client rects as drawn
      measureClientRectsFrom(0, 0, zoom);
      const trigger = renderAt({ top: 188, left: 100 });
      sizeElements(320, 200);
      const placement = () => {
        const { top, left, maxHeight, width } = popup().style;
        return { top, left, maxHeight, width };
      };
      await user.click(trigger);
      // A frame on, as jsdom computes the popup no width to tell the zoom by until one is written
      await new Promise(requestAnimationFrame);
      const placed = placement();

      // 5px of its own below the trigger's 208px bottom, inside the 1024 by 768 viewport, all in its own pixels
      expect(parseFloat(placed.top)).toBeCloseTo(208 / zoom + 5);
      expect(parseFloat(placed.left)).toBeCloseTo(100 / zoom);
      expect(parseFloat(placed.maxHeight)).toBeCloseTo(768 / zoom);
      expect(parseFloat(placed.width)).toBeCloseTo(1024 / zoom);

      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);

      expect(placement()).toEqual(placed);
    });

    test.each([
      ['as wide as the viewport', 320, '0px'],
      ['too wide for the gutter', 310, '0px'],
      ['narrow enough for the gutter', 280, '20px'],
    ])('inside the right edge of a narrow viewport where it is %s', async (_, width, left) => {
      vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(320);
      const trigger = renderAt({ top: 30, left: 100 });
      sizeElements(width, 0);

      await user.click(trigger);

      // Never past that edge, giving up as much of the 20px gutter as it must and none of the viewport's left edge
      expect(popup()).toHaveStyle({ left });
    });

    test('in the top layer, which no modal dialog, clipping or transformed ancestor reaches, where there is one', async () => {
      const trigger = renderAt({ top: 30, left: 10 });

      await user.click(trigger);

      expect(popup()).toHaveAttribute('popover', 'manual');
      expect(vi.mocked(HTMLElement.prototype.showPopover).mock.contexts).toEqual([popup()]);
      // Undoing the browser's popover padding and centering, which a page without Tailwind's preflight keeps, and
      // keeping its border inside the width and height fitted to the viewport, which preflight's `box-sizing` does
      expect(popup()).toHaveStyle({
        marginTop: '0px',
        marginLeft: '0px',
        paddingTop: '0px',
        paddingLeft: '0px',
        boxSizing: 'border-box',
        width: '1024px',
      });
      // Capped at 20rem, as `max-w-xs` would be where a page's Tailwind build scans this package, since the width it is
      // given is the whole viewport's
      expect(popup().style.maxWidth).toBe('20rem');
    });

    const removeShowPopover = () => Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    // Not knowing the `:popover-open` selector, which only the browser's own popovers come with
    const rejectPopoverOpen = () => vi.mocked(CSS.supports).mockReturnValue(false);

    test.each([
      [
        'has no popovers',
        () => {
          rejectPopoverOpen();
          removeShowPopover();
        },
      ],
      // As `@oddbird/popover-polyfill` provides it, which can't show the popup in the top layer, and so can't take it
      // out of a transformed ancestor's reach
      ["has only a polyfill's `showPopover()`", rejectPopoverOpen],
      // As a DOM shim in a consumer's tests can, which would otherwise throw from the layout effect
      ['knows `:popover-open` but has no `showPopover()`', removeShowPopover],
    ])("in the field's flow just below its trigger, unplaced, where the browser %s", async (_, removePopovers) => {
      removePopovers();
      const trigger = renderAt({ top: 30, left: 10 });

      await user.click(trigger);

      // Where a transformed ancestor, as daisyUI's modal box is, lays it out and its scroll reaches it, rather than
      // fixed against that ancestor at viewport coordinates it would scale, and clip out of the scroll's reach.
      // Positioned against the field's wrapper, stacked under app chrome, and as wide as its contents in a field
      // narrower than the calendar
      expect(popup()).toHaveStyle({ position: 'absolute', marginTop: '5px', zIndex: '100', minWidth: 'min-content' });
      expect(trigger.closest('.form-control')).toHaveClass('relative');
      expect(popup().style.top).toBe('');
      expect(popup()).not.toHaveAttribute('popover');
      expect(trigger.getBoundingClientRect).not.toHaveBeenCalled();
    });

    test('hidden while a scrolling panel around the field hides all of its trigger', async () => {
      const trigger = renderAt({ top: 30, left: 10 });
      await user.click(trigger);

      intersectionObserver.leaveNode(trigger);
      expect(popup()).toHaveStyle({ visibility: 'hidden' });

      intersectionObserver.enterNode(trigger);
      expect(popup()).not.toHaveStyle({ visibility: 'hidden' });
    });

    test('measuring nothing while it is hidden, and placed by its trigger before it shows again', async () => {
      const trigger = renderAt({ top: 30, left: 10 });
      await user.click(trigger);
      intersectionObserver.leaveNode(trigger);
      const measure = vi.mocked(trigger.getBoundingClientRect);
      measure.mockClear();

      await new Promise(requestAnimationFrame);
      expect(measure).not.toHaveBeenCalled();

      // Scrolled back into sight further down
      measure.mockReturnValue(rectAt(300, 10, 40, 20));
      intersectionObserver.enterNode(trigger);
      expect(popup()).toHaveStyle({ top: '325px' });
      expect(popup()).not.toHaveStyle({ visibility: 'hidden' });

      // And following it once a frame again
      await new Promise(requestAnimationFrame);
      expect(measure).toHaveBeenCalledTimes(2);
    });

    test('giving the focus back to its trigger when it hides holding it, so the focus never falls to the body', async () => {
      const trigger = renderAt({ top: 30, left: 10 });
      await user.click(trigger);
      await user.keyboard('{ArrowDown}');
      expect(popup()).toContainElement(document.activeElement as HTMLElement);

      act(() => intersectionObserver.leaveNode(trigger));
      expect(popup()).toHaveStyle({ visibility: 'hidden' });
      expect(trigger).toHaveFocus();

      act(() => intersectionObserver.enterNode(trigger));
      expect(popup()).not.toHaveStyle({ visibility: 'hidden' });
      expect(trigger).toHaveFocus();
    });

    test('giving the focus back to its trigger when it hides holding it in a form rendered in a shadow root', async () => {
      const host = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => host.remove());
      const shadowRoot = host.attachShadow({ mode: 'open' });
      const container = shadowRoot.appendChild(document.createElement('div'));
      const trigger = renderAt({ top: 30, left: 10 }, container);
      await user.click(trigger);
      await user.keyboard('{ArrowDown}');
      // Where the document's `activeElement` is the shadow host, which the popup doesn't contain
      expect(within(container).getByRole('dialog', { hidden: true })).toContainElement(
        shadowRoot.activeElement as HTMLElement,
      );

      act(() => intersectionObserver.leaveNode(trigger));

      expect(shadowRoot.activeElement).toBe(trigger);
    });

    test("inside the viewport of a quirks-mode document, which is the body's client box rather than the root's", async () => {
      // There the root's is the whole page, and the body's the viewport, whichever of them scrolls
      const spies = [
        vi.spyOn(document, 'compatMode', 'get').mockReturnValue('BackCompat'),
        vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(3000),
        vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(3000),
        vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(1024),
        vi.spyOn(document.body, 'clientHeight', 'get').mockReturnValue(768),
      ];
      onTestFinished(() => spies.forEach((spy) => spy.mockRestore()));
      const trigger = renderAt({ top: 680, left: 984 });
      sizeElements(400, 500);

      await user.click(trigger);

      // Above the trigger and inside the right edge, as in the 1024 by 768 viewport of a standards-mode document
      expect(popup()).toHaveStyle({ top: '175px', left: '604px', maxHeight: '768px' });
    });

    /** Shrinks and moves the visual viewport inside the 1024 by 768 client box, which stays as it was, as an on-screen
     * keyboard or a pinch zoom does. jsdom has no visual viewport at all
     */
    function stubVisualViewport(viewport: { offsetTop: number; offsetLeft: number; width: number; height: number }) {
      const win = document.defaultView!;
      Object.defineProperty(win, 'visualViewport', { value: viewport, configurable: true });
      onTestFinished(() => {
        Reflect.deleteProperty(win, 'visualViewport');
      });
    }

    test('above an on-screen keyboard, which shrinks only the visual viewport', async () => {
      stubVisualViewport({ offsetTop: 0, offsetLeft: 0, width: 1024, height: 400 });
      const trigger = renderAt({ top: 100, left: 10 });
      sizeElements(320, 400);

      await user.click(trigger);

      // Scrolling within the 400px above the keyboard, from the top, so Done ends where the keyboard starts rather
      // than at 525px behind it
      expect(popup()).toHaveStyle({ top: '0px', maxHeight: '400px' });
    });

    test.each([
      ['below its trigger, inside its right edge by its own width', { top: 250, left: 700 }, 200, '275px', '472px'],
      ['above its trigger where it would run off its bottom', { top: 500, left: 400 }, 200, '295px', '400px'],
      ['as low as it fits whole where it fits neither below nor above', { top: 380, left: 400 }, 350, '234px', '400px'],
      [
        'at its top left corner where the trigger is above and left of it',
        { top: 100, left: 100 },
        200,
        '200px',
        '300px',
      ],
    ])('inside the visual viewport a pinch zoom moved, %s', async (_, rect, height, top, left) => {
      // The part from (300, 200) to (812, 584) of the client box
      stubVisualViewport({ offsetTop: 200, offsetLeft: 300, width: 512, height: 384 });
      const trigger = renderAt(rect);
      sizeElements(320, height);

      await user.click(trigger);

      expect(popup()).toHaveStyle({ top, left, maxHeight: '384px' });
    });

    test('above an on-screen keyboard that comes up over its trigger while it is open, Done included', async () => {
      const viewport = { offsetTop: 0, offsetLeft: 0, width: 1024, height: 768 };
      stubVisualViewport(viewport);
      const trigger = renderAt({ top: 600, left: 10 });
      sizeElements(320, 300);
      await user.click(trigger);
      expect(popup()).toHaveStyle({ top: '295px' });

      viewport.height = 400;
      await new Promise(requestAnimationFrame);

      // Its 300px end where the keyboard starts, rather than at 595px behind it, above the trigger the keyboard hides
      expect(popup()).toHaveStyle({ top: '100px', maxHeight: '400px' });
    });

    test('inside the visual viewport a pinch zoom panned above its trigger, Done included', async () => {
      // The part from (300, 200) to (812, 584) of the client box
      stubVisualViewport({ offsetTop: 200, offsetLeft: 300, width: 512, height: 384 });
      const trigger = renderAt({ top: 680, left: 400 });
      sizeElements(320, 200);

      await user.click(trigger);

      // Its 200px end at that part's bottom, rather than at 675px just above the trigger
      expect(popup()).toHaveStyle({ top: '384px' });
    });

    test('no wider than a visual viewport narrower than itself, as it narrows and pans while the popup is open', async () => {
      // A pinch zoom that leaves 200px of the client box's width in sight, from 300px in
      const viewport = { offsetTop: 200, offsetLeft: 300, width: 200, height: 384 };
      stubVisualViewport(viewport);
      const trigger = renderAt({ top: 250, left: 400 });
      sizeElements(320, 200);
      await user.click(trigger);
      // Its right edge where that part ends, rather than 120px past it, scrolling what no longer fits
      expect(popup()).toHaveStyle({ width: '200px', left: '300px' });

      Object.assign(viewport, { offsetLeft: 350, width: 150 });
      await new Promise(requestAnimationFrame);

      expect(popup()).toHaveStyle({ width: '150px', left: '350px' });
    });

    test.each([
      ['below', { top: 50, left: 100 }, '275px'],
      ['above', { top: 300, left: 100 }, '295px'],
    ])(
      '%s its trigger where client rects are measured from the visual viewport, as WebKit measures them',
      async (_, rect, top) => {
        // The part from (300, 200) to (812, 584) of the client box, whose corner WebKit measures client rects from,
        // rather than the corner of the layout viewport that a fixed popup's `top` and `left` are measured from
        stubVisualViewport({ offsetTop: 200, offsetLeft: 300, width: 512, height: 384 });
        measureClientRectsFrom(200, 300);
        const trigger = renderAt(rect);
        sizeElements(320, 200);

        await user.click(trigger);

        // Next to the trigger, which is 200px lower and 300px further right of that corner than its client rect says
        expect(popup()).toHaveStyle({ top, left: '400px' });
      },
    );
  });

  test("translates the Done button and the time input's label", async () => {
    const { container } = render(
      <Form
        schema={{ type: 'string', format: 'date-time' }}
        validator={validator}
        translateString={(key) => `translated ${key}`}
      />,
    );

    await openPicker(container);

    expect(screen.getByRole('button', { name: 'translated Done' })).toBeInTheDocument();
    expect(screen.getByLabelText('translated Time')).toBeInTheDocument();
  });
});
