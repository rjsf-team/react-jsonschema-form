'use client';

import type { FocusEvent, FocusEventHandler, ReactElement } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '../../lib/utils.ts';
import { Command, CommandGroup, CommandItem, CommandList } from './command.tsx';

/**
 * Represents an item in the fancy select dropdown
 */
export interface FancySelectItem<V = unknown> {
  /** The value of the item */
  value: V;
  /** The display label for the item */
  label: string;
  /** The index position of the item */
  index: number;
  /** Whether the item is disabled */
  disabled?: boolean;
}

/**
 * Represents a labeled section (an `<optgroup>` equivalent) of items in the dropdown. A section without a `label`
 * renders as a plain, unheaded group, used for options that aren't part of any `ui:options.optgroups` group.
 */
export interface FancySelectSection<V = unknown> {
  /** The section's heading, omitted for an unlabeled group */
  label?: string;
  /** The items belonging to this section */
  items: FancySelectItem<V>[];
}

/** The React key for the unheaded section. `toSections()` emits at most one of them, always last, so a constant key
 * keeps it mounted as earlier sections come and go - an index would shift, remounting the group and discarding
 * cmdk's highlight and scroll state mid-interaction. Labeled sections are prefixed so no label can collide with it.
 */
export const UNGROUPED_SECTION_KEY = 'ungrouped';

/**
 * Props interface for the FancySelect component
 */
interface FancySelectInterface {
  /** The id given to the combobox that opens the dropdown, so a label can point at it */
  id?: string;
  /** Array of items to display in the dropdown, each valued by the string it is selected by */
  items: FancySelectItem<string>[] | undefined;
  /** When provided, renders `items` grouped into these labeled sections instead of one flat list */
  sections?: FancySelectSection<string>[];
  /** Currently selected item value */
  selected: string;
  /** Callback function when value changes */
  onValueChange?: (value: string) => void;
  /** Whether the component should autofocus */
  autoFocus?: boolean;
  /** Accessible name given to the combobox that opens the dropdown, for a select that no label points at, since a
   * combobox takes no name from the item it displays, which is its value */
  ariaLabel?: string;
  /** The ids of the elements naming the combobox, for a select whose label's `for` names another element */
  ariaLabelledby?: string;
  /** ID of the element that describes this select */
  ariaDescribedby?: string;
  /** Whether the select is invalid, which the combobox says through `aria-invalid` */
  ariaInvalid?: boolean;
  /** Aria placeholder text */
  ariaPlaceholder?: string;
  /** Additional className for styling */
  className?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Callback function for blur event */
  onBlur?: FocusEventHandler<HTMLDivElement> | undefined;
  /** Callback function for focus event */
  onFocus?: FocusEventHandler<HTMLDivElement> | undefined;
  /** Whether the field is required, which the combobox says through `aria-required` */
  required?: boolean;
  /** Placeholder text when no item is selected */
  placeholder: string;
}

/** The value cmdk holds an item under, its index, since cmdk trims the value an item registers and takes it for the
 * item's identity, so items such as `' a'` and `'a'` would share one and highlight together
 *
 * @param item - The item
 * @returns - Its index, as text
 */
function cmdkValue(item: FancySelectItem<string>) {
  return String(item.index);
}

/** The option cmdk renders for a value it holds, found by the `data-value` it gives the option, since it keeps the
 * option's id to itself
 *
 * @param container - The element the options render in
 * @param value - The value cmdk holds the option under
 * @returns - The option, if it is rendered
 */
function cmdkOption(container: HTMLElement | null, value: string) {
  return [...(container?.querySelectorAll<HTMLElement>('[cmdk-item]') ?? [])].find(
    (option) => option.dataset.value === value,
  );
}

/** Returns the ids cmdk gives a listbox and its highlighted option, which it keeps to itself, so a combobox can point
 * at them, with the ref callbacks to put on the `CommandList` and on the highlighted `CommandItem`. An element hands its
 * id over as it mounts, before the browser paints, and takes it back as it unmounts, so a list that opens again under
 * new ids is never pointed at by the ids of the one that closed.
 * The callbacks are stable, but cmdk composes them into a new ref on each render, so React detaches and reattaches them
 * at every commit while the list is open. That sets each id to `undefined` and back, and React's extra render pass
 * bails out on the unchanged value. Ignoring the `null` instead would keep the id of an element that really unmounted,
 * as a detach can't tell whether a reattach follows
 *
 * @returns - The ids, undefined while nothing holds them, and the ref callbacks reading them
 */
export function useCmdkIds() {
  const [listboxId, setListboxId] = useState<string>();
  const [highlightedId, setHighlightedId] = useState<string>();
  const listboxRef = useCallback((listbox: HTMLElement | null) => setListboxId(listbox?.id), []);
  const highlightedRef = useCallback((option: HTMLElement | null) => setHighlightedId(option?.id), []);
  return { listboxId, highlightedId, listboxRef, highlightedRef };
}

/**
 * A fancy select component that provides a styled dropdown with search functionality
 * @param props - The component props
 * @returns A React component that renders a searchable select dropdown
 */
export function FancySelect({
  id,
  items,
  sections,
  selected,
  onValueChange,
  autoFocus = false,
  disabled = false,
  placeholder,
  ariaLabel,
  ariaLabelledby,
  ariaDescribedby,
  ariaInvalid,
  ariaPlaceholder,
  required,
  onFocus,
  onBlur,
  className,
}: Readonly<FancySelectInterface>): ReactElement {
  const [open, setOpen] = useState(false);
  const popupId = useId();
  // Focus stays on the combobox while cmdk highlights an option, so the combobox points at the highlighted option and at
  // the listbox holding it by the ids cmdk gives them, which it keeps to itself. cmdk reports the option it highlights
  // only while its value is controlled
  const [highlighted, setHighlighted] = useState('');
  const { listboxId, highlightedId, listboxRef, highlightedRef } = useCmdkIds();
  const selectedItem = items?.find((item) => item.value === selected);
  const selectedValue = selectedItem && cmdkValue(selectedItem);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && selectedValue !== undefined) {
      requestAnimationFrame(() => {
        cmdkOption(containerRef.current, selectedValue)?.scrollIntoView({ block: 'nearest' });
      });
    }
  }, [open, selectedValue]);

  // Options that empty while it is open leave no listbox, so it closes rather than point at the one that unmounted, and
  // a select that turns disabled or readonly while open closes, as no option can be chosen from it
  if (open && (disabled || !items?.length)) {
    setOpen(false);
  }
  // The listbox opens on the option the select holds, as a native select's does, so Enter keeps the value until the
  // highlight is moved, else on the first option a user can choose, rather than on one an earlier opening left
  // highlighted, which cmdk keeps
  const itemsInOrder = sections ? sections.flatMap((section) => section.items) : items;
  const openList = () => {
    // With no option to show, it would open on an empty popup a screen reader announces as expanded
    if (!itemsInOrder?.length) {
      return;
    }
    const opening = selectedItem ?? itemsInOrder.find((item) => !item.disabled);
    if (opening) {
      setHighlighted(cmdkValue(opening));
    }
    setOpen(true);
  };
  const toggleList = () => {
    if (open) {
      setOpen(false);
    } else {
      openList();
    }
  };
  const highlightedItem = items?.find((candidate) => cmdkValue(candidate) === highlighted);
  // Choosing the option the select already holds reports no change, as a native select's doesn't
  const choose = (item: FancySelectItem<string> | undefined) => {
    if (item && !item.disabled && item.value !== selected) {
      onValueChange?.(item.value);
    }
    setOpen(false);
  };
  // cmdk moves the highlight among the options a user can choose, so from a disabled one, as the option the select holds
  // and opens on can be, it finds no place to move from: Down Arrow, and its Ctrl+N and Ctrl+J, go to the first option,
  // and Up Arrow, Ctrl+P and Ctrl+K nowhere. Those keys move from that option's own place in the list instead. cmdk
  // scrolls only to a highlight it moves itself, not to one its controlled value is given, so the option is scrolled into
  // view here
  const highlightFromDisabled = (down: boolean) => {
    const order = itemsInOrder ?? [];
    const at = order.findIndex((item) => cmdkValue(item) === highlighted);
    const next = down
      ? order.slice(at + 1).find((item) => !item.disabled)
      : order.slice(0, at).findLast((item) => !item.disabled);
    if (next) {
      const value = cmdkValue(next);
      setHighlighted(value);
      cmdkOption(containerRef.current, value)?.scrollIntoView({ block: 'nearest' });
    }
  };
  // cmdk's Alt+Arrow jumps to the first option a user can choose in the next or previous group, which it finds from a
  // disabled option too, but with no such group, as in a list of one, it falls back to the step that can't move from one
  const groupBeyond = (down: boolean) => {
    const at = sections?.findIndex((section) => section.items.some((item) => cmdkValue(item) === highlighted));
    if (!sections || at === undefined || at === -1) {
      return false;
    }
    const beyond = down ? sections.slice(at + 1) : sections.slice(0, at);
    return beyond.some((section) => section.items.some((item) => !item.disabled));
  };

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
      setOpen(false);
    }
    onBlur?.(e);
  };

  function renderItem(item: FancySelectItem<string>) {
    return (
      <CommandItem
        disabled={item.disabled}
        ref={cmdkValue(item) === highlighted ? highlightedRef : undefined}
        key={item.value}
        value={cmdkValue(item)}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onSelect={() => choose(item)}
        className={cn(
          'cursor-pointer relative flex items-center justify-between rounded-sm py-1.5 gap-2 rtl:flex-row-reverse',
          item.value === selected && 'font-semibold',
          item.disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span>{item.label}</span>
        <span className='flex h-3.5 w-3.5 items-center justify-center'>
          {item.value === selected && <Check className='h-4 w-4' />}
        </span>
      </CommandItem>
    );
  }

  return (
    <Command
      ref={containerRef}
      className={cn('overflow-visible bg-transparent', className)}
      aria-disabled={disabled}
      onBlur={handleBlur}
      onFocus={onFocus}
      value={highlighted}
      onValueChange={setHighlighted}
      aria-placeholder={ariaPlaceholder}
    >
      {/* A combobox, as a native select is, so it can be `aria-invalid`, which a button can't, and holds the item it
          displays as its value. It controls the listbox while it is open, and the element the listbox opens in while
          it is closed */}
      <button
        id={id}
        type='button'
        role='combobox'
        disabled={disabled}
        // oxlint-disable-next-line jsx-a11y/no-autofocus -- the widget's `ui:autofocus`, as the widgets the rule is off for honor it
        autoFocus={autoFocus}
        aria-expanded={open}
        aria-haspopup='listbox'
        aria-controls={(open && listboxId) || popupId}
        aria-activedescendant={open ? highlightedId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid || undefined}
        aria-required={required || undefined}
        onClick={() => !disabled && toggleList()}
        // The keys of a select-only combobox, which its role leads a screen reader user to press: the arrow keys open
        // it, Escape closes it, and Space or Enter chooses the option highlighted while it is open. The arrow keys move
        // the highlight once it is open, which cmdk does
        onKeyDown={(e) => {
          // Enter on a highlighted option a user can choose is left to cmdk, which chooses it. cmdk ignores Enter on a
          // disabled one, as the option the select holds can be, so that closes the list here
          if (disabled || (e.key === 'Enter' && open && highlightedId && !highlightedItem?.disabled)) {
            return;
          }
          const opensList = !open && (e.key === 'ArrowDown' || e.key === 'ArrowUp');
          // cmdk's vim bindings, on by default, step as the arrows do
          const down = e.key === 'ArrowDown' || (e.ctrlKey && (e.key === 'n' || e.key === 'j'));
          const up = e.key === 'ArrowUp' || (e.ctrlKey && (e.key === 'p' || e.key === 'k'));
          // cmdk's Meta jump to the list's end, and its Alt jump to another group where there is one, find their way
          // from a disabled option
          const movesFromDisabled =
            open &&
            (down || up) &&
            !e.metaKey &&
            !(e.altKey && groupBeyond(down)) &&
            Boolean(highlightedItem?.disabled);
          if (opensList) {
            openList();
          } else if (movesFromDisabled) {
            highlightFromDisabled(down);
          } else if (e.key === ' ' && open) {
            choose(highlightedItem);
          } else if (e.key === 'Enter' || e.key === ' ') {
            toggleList();
          } else if (open && e.key === 'Escape') {
            setOpen(false);
          } else {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
        }}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <span className={cn('flex-1 line-clamp-1', !selectedItem && 'text-muted-foreground')}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown className='h-4 w-4 opacity-50' />
      </button>
      <div id={popupId} className='relative'>
        {open && items && items.length > 0 ? (
          <div
            style={{ top: '0.5rem' }}
            className='absolute w-full z-10 rounded-md border bg-popover text-popover-foreground shadow-md outline-none'
          >
            {sections ? (
              <CommandList ref={listboxRef} className='h-full overflow-auto'>
                {sections.map((section) => (
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
                <CommandList ref={listboxRef}>{items.map(renderItem)}</CommandList>
              </CommandGroup>
            )}
          </div>
        ) : null}
      </div>
    </Command>
  );
}
