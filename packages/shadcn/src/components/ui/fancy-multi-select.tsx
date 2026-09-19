'use client';

import type { FocusEvent, FocusEventHandler, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { deepEquals } from '@rjsf/utils';
import { Command as CommandPrimitive } from 'cmdk';
import { X } from 'lucide-react';

import { cn } from '../../lib/utils.ts';
import { Badge } from './badge.tsx';
import { Command, CommandGroup, CommandItem, CommandList } from './command.tsx';
import type { FancySelectItem, FancySelectSection } from './fancy-select.tsx';

/**
 * Props interface for the FancyMultiSelect component
 */
interface FancyMultiSelectProps {
  /** Whether multiple items can be selected */
  multiple: boolean;
  /** Array of items to display in the dropdown */
  items?: FancySelectItem[];
  /** When provided, renders `items` grouped into these labeled sections instead of one flat list */
  sections?: FancySelectSection[];
  /** Array of selected item values */
  selected: string[];
  /** Callback function when value changes */
  onValueChange?: (value: number[]) => void;
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
  onBlur?: FocusEventHandler<HTMLDivElement>;
  /** Callback function for focus event */
  onFocus?: FocusEventHandler<HTMLDivElement>;
  /** Unique identifier for the component */
  id: string;
}

/**
 * A fancy multi-select component that allows users to select multiple items from a dropdown
 * @param props - The component props
 * @returns A React component that renders a searchable multi-select dropdown with tags
 */
export function FancyMultiSelect({
  multiple,
  items = [],
  sections,
  selected,
  onValueChange,
  autoFocus = false,
  disabled = false,
  ariaDescribedby,
  ariaPlaceholder,
  onFocus,
  onBlur,
  className,
  id,
}: Readonly<FancyMultiSelectProps>): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const selectedItems = useMemo(
    () => items.filter((item) => selected.some((selectedValue) => deepEquals(item.value, selectedValue))),
    [items, selected],
  );

  const selectables = useMemo(
    () => items.filter((framework) => !selectedItems.some((item) => deepEquals(item.value, framework.value))),
    [items, selectedItems],
  );

  const selectableSections = useMemo(() => {
    if (!sections) {
      return undefined;
    }
    return sections
      .map((section) => ({
        label: section.label,
        items: section.items.filter(
          (framework) => !selectedItems.some((item) => deepEquals(item.value, framework.value)),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, selectedItems]);

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
      }
    },
    [selectedItems, onValueChange, disabled],
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
      if (!disabled) {
        setOpen(true);
      }
      onFocus?.(e);
    },
    [disabled, onFocus],
  );

  function renderItem(item: FancySelectItem) {
    return (
      <CommandItem
        disabled={item.disabled}
        key={`${item.value}-command-item`}
        value={String(item.value)}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-controls={`${item.value}-command-item`}
        aria-labelledby={`${item.value}-command-item`}
        id={`${item.value}-command-item`}
        onSelect={() => handleSelect(item)}
        className='cursor-pointer'
      >
        {item.label}
      </CommandItem>
    );
  }

  const hasSelectableOptions = selectableSections ? selectableSections.length > 0 : selectables.length > 0;

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn('overflow-visible bg-transparent', className)}
      autoFocus={autoFocus}
      aria-disabled={disabled}
      onBlur={onBlur}
      onFocus={handleFocus}
      aria-describedby={ariaDescribedby}
      aria-placeholder={ariaPlaceholder}
    >
      <div
        className={cn(
          'group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className='flex gap-1 flex-wrap'>
          {selectedItems.map((item) => (
            <Badge key={item.value} variant='secondary'>
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
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => !disabled && setOpen(true)}
            placeholder='Select ...'
            className='rtl:mr-2 ltr:ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1'
            disabled={disabled}
            aria-controls={`command-item-input-${id}`}
            aria-labelledby={`command-item-input-${id}`}
            id={`command-item-input-${id}`}
          />
        </div>
      </div>
      {open && !disabled && hasSelectableOptions && (
        <div className='relative mt-2'>
          <div className='absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in'>
            {selectableSections ? (
              <CommandList className='h-full overflow-auto'>
                {selectableSections.map((section, sectionIndex) => (
                  <CommandGroup key={section.label ?? `ungrouped-${sectionIndex}`} heading={section.label}>
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
