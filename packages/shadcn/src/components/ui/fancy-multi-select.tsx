'use client';

import type { FocusEvent, FocusEventHandler, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deepEquals, enumOptionValueLabel } from '@rjsf/utils';
import { defaultFilter } from 'cmdk';
import { X } from 'lucide-react';

import { cn } from '../../lib/utils.ts';
import { Badge } from './badge.tsx';
import { Command, CommandGroup, CommandItem, CommandList } from './command.tsx';
import { cmdkOption, UNGROUPED_SECTION_KEY } from './fancy-select.tsx';
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

/** Whether an item matches the search, by the value or the label it shows, never by the index cmdk holds it under
 *
 * @param item - The item
 * @param search - The text typed in the input
 * @returns - Whether the item is listed
 */
function matchesSearch(item: FancySelectItem, search: string) {
  return search === '' || defaultFilter(`${enumOptionValueLabel(item.value)} ${item.label}`, search) > 0;
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
  items = NO_ITEMS,
  sections,
  selected,
  onValueChange,
  autoFocus = false,
  disabled = false,
  ariaDescribedby,
  ariaInvalid,
  placeholder,
  required,
  onFocus,
  onBlur,
  className,
}: Readonly<FancyMultiSelectProps>): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  // The input is our own rather than cmdk's `Command.Input`, which replaces the `id`, `aria-expanded`, `aria-controls`
  // and `aria-labelledby` it is given with its own. cmdk gives the listbox and the options ids it keeps to itself, so
  // the input points at them by the ids read from the page
  const containerRef = useRef<HTMLDivElement>(null);
  const [listboxId, setListboxId] = useState<string>();

  const selectedItems = useMemo(
    () => items.filter((item) => selected.some((selectedValue) => deepEquals(item.value, selectedValue))),
    [items, selected],
  );

  const isListed = useCallback(
    (search: string) => (framework: FancySelectItem) =>
      !selectedItems.some((item) => deepEquals(item.value, framework.value)) && matchesSearch(framework, search),
    [selectedItems],
  );

  const selectables = useMemo(() => items.filter(isListed(inputValue)), [items, isListed, inputValue]);

  const selectableSections = useMemo(
    () =>
      sections
        ?.map((section) => ({ label: section.label, items: section.items.filter(isListed(inputValue)) }))
        .filter((section) => section.items.length > 0),
    [sections, isListed, inputValue],
  );

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

  // The focus `autoFocus` gives the input as it mounts opens no list, which would cover the fields below before the user
  // does anything, so the list opens on the user's own focus, click, typing or Down Arrow. React focuses it while
  // committing the mount, before this effect runs
  const focusedOnMount = useRef(autoFocus);
  useEffect(() => {
    focusedOnMount.current = false;
  }, []);
  const openList = useCallback(() => {
    if (!disabled && !focusedOnMount.current) {
      setOpen(true);
    }
  }, [disabled]);

  // cmdk moves the highlight to a search's first match only for a search typed in its own input, so the highlight is
  // held here and moved to that match as the search changes
  const [highlighted, setHighlighted] = useState('');
  const search = (newValue: string) => {
    setInputValue(newValue);
    const first = (sections ? sections.flatMap((section) => section.items) : items).find(
      (item) => !item.disabled && isListed(newValue)(item),
    );
    setHighlighted(first ? String(first.index) : '');
    openList();
  };

  // Read as the options change too, not only as the highlight moves: cmdk mounts the options afresh, under new ids, as
  // the list opens or a search changes them
  const [highlightedId, setHighlightedId] = useState<string>();
  const shownOptions = selectableSections ?? selectables;
  useEffect(() => {
    const container = containerRef.current;
    if (!open || !container || shownOptions.length === 0) {
      return;
    }
    setHighlightedId(cmdkOption(container, highlighted)?.id);
    setListboxId(container.querySelector<HTMLElement>('[cmdk-list]')?.id);
  }, [open, highlighted, shownOptions]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled || inputRef.current?.value !== '') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const newSelected = selectedItems.slice(0, -1);
        onValueChange?.(newSelected.map((item) => item.index));
      } else if (e.key === 'Escape') {
        inputRef.current.blur();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        // The input `autoFocus` focuses as it mounts opens no list, so either arrow opens it, as on a closed combobox
        openList();
      }
    },
    [selectedItems, onValueChange, disabled, openList],
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

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      openList();
      onFocus?.(e);
    },
    [openList, onFocus],
  );

  // The list opens on focus anywhere in the select, a remove button's included, which the input's blur doesn't follow, so
  // it closes as focus leaves the select
  const handleBlur = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setOpen(false);
      }
      onBlur?.(e);
    },
    [onBlur],
  );

  function renderItem(item: FancySelectItem) {
    // Keyed and identified by index, since cmdk takes `value` for an option's identity, where `1` and `'1'` would share
    // one as text and `''` would have none, and a highlight it holds is lost as that text changes
    return (
      <CommandItem
        disabled={item.disabled}
        key={item.index}
        value={String(item.index)}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onSelect={() => handleSelect(item)}
        className='cursor-pointer'
      >
        {item.label}
      </CommandItem>
    );
  }

  const hasSelectableOptions = selectableSections ? selectableSections.length > 0 : selectables.length > 0;
  const listShown = open && !disabled && hasSelectableOptions;

  return (
    // The options are filtered here, as the search is typed in an input cmdk doesn't own
    <Command
      ref={containerRef}
      shouldFilter={false}
      value={highlighted}
      onValueChange={setHighlighted}
      onKeyDown={handleKeyDown}
      className={cn('overflow-visible bg-transparent', className)}
      aria-disabled={disabled}
      onBlur={handleBlur}
      onFocus={handleFocus}
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
                onKeyDown={(e) => e.key === 'Enter' && !disabled && handleUnselect(item)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(item)}
                disabled={disabled}
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
            aria-controls={listShown ? listboxId : undefined}
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
      {listShown && (
        <div className='relative mt-2'>
          <div className='absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in'>
            {selectableSections ? (
              <CommandList className='h-full overflow-auto'>
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
                <CommandList>{selectables.map(renderItem)}</CommandList>
              </CommandGroup>
            )}
          </div>
        </div>
      )}
    </Command>
  );
}
