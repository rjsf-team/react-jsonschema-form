'use client';

import type { FocusEvent, FocusEventHandler, ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '../../lib/utils.ts';
import { Command, CommandGroup, CommandItem, CommandList } from './command.tsx';

/**
 * Represents an item in the fancy select dropdown
 */
export interface FancySelectItem {
  /** The value of the item */
  value: any;
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
export interface FancySelectSection {
  /** The section's heading, omitted for an unlabeled group */
  label?: string;
  /** The items belonging to this section */
  items: FancySelectItem[];
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
  /** Array of items to display in the dropdown */
  items: FancySelectItem[] | undefined;
  /** When provided, renders `items` grouped into these labeled sections instead of one flat list */
  sections?: FancySelectSection[];
  /** Currently selected item value */
  selected: string;
  /** Callback function when value changes */
  onValueChange?: (value: any) => void;
  /** Whether the component should autofocus */
  autoFocus?: boolean;
  /** ID of the element that describes this select */
  ariaDescribedby?: string;
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
  /** Whether the field is required */
  required?: boolean;
  /** Placeholder text when no item is selected */
  placeholder?: string;
}

/**
 * A fancy select component that provides a styled dropdown with search functionality
 * @param props - The component props
 * @returns A React component that renders a searchable select dropdown
 */
export function FancySelect({
  items,
  sections,
  selected,
  onValueChange,
  autoFocus = false,
  disabled = false,
  placeholder = 'Select...',
  ariaDescribedby,
  ariaPlaceholder,
  onFocus,
  onBlur,
  className,
}: Readonly<FancySelectInterface>): ReactElement {
  const [open, setOpen] = useState(false);
  const selectedItem = items?.find((item) => item.value === selected);
  const selectedRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && selectedRef.current) {
      requestAnimationFrame(() => {
        selectedRef.current?.scrollIntoView({ block: 'nearest' });
      });
    }
  }, [open]);

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
    onBlur?.(e);
  };

  function renderItem(item: FancySelectItem) {
    return (
      <CommandItem
        ref={item.value === selected ? selectedRef : undefined}
        key={item.value}
        value={String(item.value)}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onSelect={() => {
          if (!item.disabled) {
            onValueChange?.(item.value);
            setOpen(false);
          }
        }}
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
      autoFocus={autoFocus}
      aria-disabled={disabled}
      onBlur={handleBlur}
      onFocus={onFocus}
      aria-describedby={ariaDescribedby}
      aria-placeholder={ariaPlaceholder}
    >
      <button
        type='button'
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup='listbox'
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!open);
          }
        }}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <span className={cn('flex-1 line-clamp-1', !selectedItem && 'text-muted-foreground')}>
          {selectedItem?.label || placeholder}
        </span>
        <ChevronDown className='h-4 w-4 opacity-50' />
      </button>
      <div className='relative'>
        {open && items && items.length > 0 ? (
          <div
            style={{ top: '0.5rem' }}
            className='absolute w-full z-10 rounded-md border bg-popover text-popover-foreground shadow-md outline-none'
          >
            {sections ? (
              <CommandList className='h-full overflow-auto'>
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
                <CommandList>{items.map(renderItem)}</CommandList>
              </CommandGroup>
            )}
          </div>
        ) : null}
      </div>
    </Command>
  );
}
