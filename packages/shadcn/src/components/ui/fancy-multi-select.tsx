'use client';

import type { FocusEventHandler, KeyboardEvent, MouseEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { deepEquals, enumOptionValueLabel } from '@rjsf/utils';
import { defaultFilter } from 'cmdk';
import { X } from 'lucide-react';

import { cn } from '../../lib/utils.ts';
import { Badge } from './badge.tsx';
import { Command, CommandGroup, CommandItem, CommandList } from './command.tsx';
import { scrollOptionIntoView, UNGROUPED_SECTION_KEY, useCmdkIds, useEscapeKeptFromDialog } from './fancy-select.tsx';
import type { FancySelectItem, FancySelectSection } from './fancy-select.tsx';

/**
 * Props interface for the FancyMultiSelect component
 */
interface FancyMultiSelectProps {
  /** The id given to the combobox input, so the field's label points at it */
  id?: string;
  /** Accessible name given to the combobox input, for a select that no label points at */
  ariaLabel?: string;
  /** The ids of the elements naming the combobox input, for a select whose label's `for` names another element */
  ariaLabelledby?: string;
  /** The `aria-labelledby` or the `aria-label` naming the listbox, from `listboxAriaProps()` */
  listName: { 'aria-labelledby'?: string; 'aria-label'?: string };
  /** Whether multiple items can be selected */
  multiple: boolean;
  /** Array of items to display in the dropdown */
  items?: FancySelectItem[];
  /** When provided, renders `items` grouped into these labeled sections instead of one flat list */
  sections?: FancySelectSection[];
  /** Array of selected item values */
  selected: unknown[];
  /** Callback function when value changes */
  onValueChange?: (value: number[]) => void;
  /** Whether the component should autofocus */
  autoFocus?: boolean;
  /** ID of the element that describes this select */
  ariaDescribedby?: string;
  /** Whether the select is invalid, which the combobox input says through `aria-invalid` */
  ariaInvalid?: boolean;
  /** Visible placeholder text for the search input */
  placeholder?: string;
  /** The accessible name of the button removing a selected item, given the item's label */
  removeItemLabel: (label: string) => string;
  /** Whether a selection is required, exposed as `aria-required` on the combobox input */
  required?: boolean;
  /** Additional className for styling */
  className?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Callback function for blur event */
  onBlur?: FocusEventHandler<HTMLDivElement>;
  /** Callback function for focus event */
  onFocus?: FocusEventHandler<HTMLDivElement>;
}

const NO_ITEMS: FancySelectItem[] = [];

/** Returns the `items` the search matches, best match first, with the best match's score, as cmdk ranked the options
 * it filtered. An item is matched by the value or the label it shows, never by the index cmdk holds it under. An empty
 * search matches every item, which keeps its schema order
 *
 * @param items - The items, in schema order
 * @param search - The text typed in the input
 * @returns - The items, ranked, and the score of the first, 0 for none or an empty search
 */
function rankedForSearch(items: FancySelectItem[], search: string) {
  if (search === '') {
    return { items, best: 0 };
  }
  const scored = items
    .map((item) => ({ item, score: defaultFilter(`${enumOptionValueLabel(item.value)} ${item.label}`, search) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  return { items: scored.map(({ item }) => item), best: scored.length > 0 ? scored[0].score : 0 };
}

/**
 * A fancy multi-select component that allows users to select multiple items from a dropdown
 * @param props - The component props
 * @returns A React component that renders a searchable multi-select dropdown with tags
 */
export function FancyMultiSelect({
  id,
  multiple,
  ariaLabel,
  ariaLabelledby,
  listName,
  items = NO_ITEMS,
  sections,
  selected,
  onValueChange,
  autoFocus = false,
  disabled = false,
  ariaDescribedby,
  ariaInvalid,
  placeholder,
  removeItemLabel,
  required,
  onFocus,
  onBlur,
  className,
}: Readonly<FancyMultiSelectProps>): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  // The input is our own rather than cmdk's `Command.Input`, which replaces the `id`, `aria-expanded`, `aria-controls`
  // and `aria-labelledby` it is given with its own. cmdk gives the listbox and the options ids it keeps to itself, so
  // the input points at them by the ids their refs read, and at the element the list opens in while it is closed
  const { listboxId, highlightedId, listboxRef, highlightedRef } = useCmdkIds();
  const popupId = useId();

  const selectedItems = useMemo(
    () => items.filter((item) => selected.some((selectedValue) => deepEquals(item.value, selectedValue))),
    [items, selected],
  );

  // A search's matches are ranked by how well they match, in a flat list as in each group, and the groups by their best
  // match, ties keeping schema order, as cmdk ranked the options it filtered. Rebuilt only as the options, the selection
  // or the search change, not as the highlight moves
  const { selectableSections, selectables } = useMemo(() => {
    const unselected = (framework: FancySelectItem) =>
      !selectedItems.some((item) => deepEquals(item.value, framework.value));
    if (!sections) {
      return {
        selectableSections: undefined,
        selectables: rankedForSearch(items.filter(unselected), inputValue).items,
      };
    }
    const ranked = sections
      .map((section) => ({ label: section.label, ...rankedForSearch(section.items.filter(unselected), inputValue) }))
      .filter((section) => section.items.length > 0)
      .sort((a, b) => b.best - a.best);
    return { selectableSections: ranked, selectables: ranked.flatMap((section) => section.items) };
  }, [items, sections, selectedItems, inputValue]);

  const handleUnselect = useCallback(
    (framework: FancySelectItem) => {
      if (disabled) {
        return;
      }
      const newSelected = selectedItems.filter((s) => !deepEquals(s.value, framework.value));
      onValueChange?.(newSelected.map((item) => item.index));
    },
    [selectedItems, onValueChange, disabled],
  );

  // The list opens on a click, typing, an arrow key or Enter, not on focus, which `autoFocus` and `focusOnFirstError`
  // give the input too, where a list opening would cover the fields below before the user does anything
  const openList = useCallback(() => {
    if (!disabled) {
      setOpen(true);
    }
  }, [disabled]);

  // cmdk moves the highlight to a search's first match only for a search typed in its own input, so a new search
  // forgets the option the highlight was moved to, and the highlight falls back to the first match. Whether cmdk moved
  // it is kept, since cmdk scrolls to a highlight it moves by key and leaves the list where it is under the pointer
  const [movedTo, setMovedTo] = useState<{ value: string; byCmdk: boolean }>();
  const firstMatch = selectables.find((item) => !item.disabled);
  const highlighted = movedTo?.value ?? (firstMatch ? String(firstMatch.index) : '');
  // cmdk reports `''` as the list unmounts, which names no option
  const cmdkMoved = (value: string) => setMovedTo(value ? { value, byCmdk: true } : undefined);
  const search = (newValue: string) => {
    setInputValue(newValue);
    setMovedTo(undefined);
    openList();
  };

  // A select that turns disabled or readonly while open closes, as the single select does, so its list doesn't come back
  // by itself as it is enabled again
  if (open && disabled) {
    setOpen(false);
  }
  const listShown = open && selectables.length > 0;
  useEscapeKeptFromDialog(listShown, inputRef);

  // The highlight this component gives cmdk, as the list opens or a search changes, is scrolled into view here, since
  // cmdk scrolls only to one it moves itself
  const setHere = !movedTo?.byCmdk;
  useEffect(() => {
    if (listShown && setHere) {
      scrollOptionIntoView(containerRef.current, highlighted);
    }
  }, [listShown, highlighted, setHere]);

  // The arrows, Enter, Escape, Backspace and Delete act only from the input, never from a remove button, which they reach
  // too: an arrow there would open a list whose highlight the input, holding `aria-activedescendant`, would announce
  // without focus, and Backspace would remove the last item rather than that button's. Down Arrow and Enter open a closed
  // list on its first match and Up Arrow on its last, as a combobox does, since cmdk, which moves the highlight in an open
  // list, takes Enter in a closed one too and does nothing with it. Escape closes the list and keeps focus in the input,
  // and goes no further while the list is shown, so it doesn't also close a dialog the form is in, but one that ends an
  // IME composition is left to the IME. Backspace and Delete in an empty input remove the last item, and report nothing
  // with none to remove. cmdk's root still takes its own keys from the input: Home and End move the highlight rather than
  // the text cursor, and Ctrl with N, J, P or K moves it in an open list and does nothing in a closed one
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (disabled || !input || e.target !== input) {
        return;
      }
      // oxlint-disable-next-line typescript/no-deprecated -- Safari marks a key ending an IME composition only so
      const composing = e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229;
      const opens = !composing && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter');
      if (opens && !listShown) {
        const lastMatch = selectables.findLast((item) => !item.disabled);
        setMovedTo(e.key === 'ArrowUp' && lastMatch ? { value: String(lastMatch.index), byCmdk: false } : undefined);
        openList();
      } else if (e.key === 'Escape' && listShown && !composing) {
        setOpen(false);
        e.preventDefault();
        e.stopPropagation();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && input.value === '' && selectedItems.length > 0) {
        const newSelected = selectedItems.slice(0, -1);
        onValueChange?.(newSelected.map((item) => item.index));
      }
    },
    [selectedItems, selectables, onValueChange, disabled, openList, listShown],
  );

  const handleSelect = useCallback(
    (item: FancySelectItem) => {
      if (disabled) {
        return;
      }
      setInputValue('');
      const newSelected = multiple ? [...selectedItems, item] : [item];
      onValueChange?.(newSelected.map((selectedItem) => selectedItem.index));
    },
    [multiple, selectedItems, onValueChange, disabled],
  );

  // A press anywhere in the select but on its input and remove buttons, such as on a selected item's label, a group
  // heading or the list's padding, would focus cmdk's root or listbox, which are out of the tab order and close the list
  // as the input blurs. No press is let move focus there, and the primary button's acts as a click on the input, whose
  // focus and open list a press inside the list leaves as they are, while another button's, or a Ctrl+click, which a Mac
  // takes for a right-click, opens its context menu alone. Text in the select can't be selected by dragging from it, the
  // cost of keeping focus in the input
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === inputRef.current) {
      return;
    }
    e.preventDefault();
    if (e.button === 0 && !(e.ctrlKey && navigator.userAgent.includes('Mac'))) {
      inputRef.current?.focus();
      openList();
    }
  };

  function renderItem(item: FancySelectItem) {
    // Keyed and identified by index, since cmdk takes `value` for an option's identity, where `1` and `'1'` would share
    // one as text and `''` would have none, and a highlight it holds is lost as that text changes
    return (
      <CommandItem
        ref={String(item.index) === highlighted ? highlightedRef : undefined}
        disabled={item.disabled}
        key={item.index}
        value={String(item.index)}
        onSelect={() => handleSelect(item)}
        className='cursor-pointer'
      >
        {item.label}
      </CommandItem>
    );
  }

  // cmdk writes the listbox's `label` as its `aria-label`, defaulting to "Suggestions", so a listbox `aria-labelledby`
  // names gets an empty one, which its accessible name ignores
  const listProps = { label: listName['aria-label'] ?? '', 'aria-labelledby': listName['aria-labelledby'] };

  return (
    // The options are filtered here, as the search is typed in an input cmdk doesn't own
    <Command
      ref={containerRef}
      withoutInput
      shouldFilter={false}
      value={highlighted}
      onValueChange={cmdkMoved}
      onKeyDown={handleKeyDown}
      className={cn('overflow-visible bg-transparent', className)}
      aria-disabled={disabled}
      onBlur={onBlur}
      onFocus={onFocus}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          'group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className='flex gap-1 flex-wrap'>
          {selectedItems.map((item) => (
            <Badge key={item.index} variant='secondary'>
              {item.label}
              <button
                type='button'
                className='rtl:mr-1 ltr:ml-1 ring-offset-background rounded-full outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1'
                // Enter clicks the button, so it is kept from cmdk's root, whose Enter cancels that click
                onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(item)}
                disabled={disabled}
                aria-label={removeItemLabel(item.label)}
              >
                <X
                  className={cn(
                    'h-3 w-3 text-muted-foreground hover:text-foreground',
                    disabled && 'pointer-events-none',
                  )}
                />
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            id={id}
            type='text'
            role='combobox'
            autoComplete='off'
            autoCorrect='off'
            spellCheck={false}
            aria-autocomplete='list'
            aria-expanded={listShown}
            aria-controls={(listShown && listboxId) || popupId}
            aria-activedescendant={listShown ? highlightedId : undefined}
            value={inputValue}
            onChange={(e) => search(e.target.value)}
            onBlur={() => setOpen(false)}
            onClick={openList}
            placeholder={placeholder}
            className='rtl:mr-2 ltr:ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1'
            disabled={disabled}
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- the widget's `ui:autofocus`, as the widgets the rule is off for honor it
            autoFocus={autoFocus}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            aria-describedby={ariaDescribedby}
            aria-invalid={ariaInvalid || undefined}
            aria-required={required || undefined}
          />
        </div>
      </div>
      <div id={popupId} className='relative'>
        {listShown && (
          <div className='absolute w-full z-10 top-0 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in'>
            {selectableSections ? (
              <CommandList ref={listboxRef} {...listProps} className='h-full overflow-auto'>
                {selectableSections.map((section) => (
                  <CommandGroup
                    key={section.label === undefined ? UNGROUPED_SECTION_KEY : `optgroup-${section.label}`}
                    heading={section.label}
                  >
                    {section.items.map(renderItem)}
                  </CommandGroup>
                ))}
              </CommandList>
            ) : (
              <CommandGroup className='h-full overflow-auto'>
                <CommandList ref={listboxRef} {...listProps}>
                  {selectables.map(renderItem)}
                </CommandList>
              </CommandGroup>
            )}
          </div>
        )}
      </div>
    </Command>
  );
}
