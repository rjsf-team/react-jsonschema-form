'use client';

import * as React from 'react';
import { FocusEventHandler, useCallback, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from './badge';
import { Command, CommandGroup, CommandItem, CommandList } from './command';
import { Command as CommandPrimitive } from 'cmdk';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../shad-lib/utils';
import { isEqual } from 'lodash';

export type FancySelectItem = {
  value: any;
  label: string;
  index: number;
  disabled?: boolean;
};

interface FancyMultiSelectProps {
  multiple: boolean;
  items?: FancySelectItem[];
  selected: string[];
  onValueChange?: (value: number[]) => void;
  autoFocus?: boolean;
  ariaDescribedby?: string;
  ariaPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  onBlur?: FocusEventHandler<HTMLDivElement>;
  onFocus?: FocusEventHandler<HTMLDivElement>;
}

export function FancyMultiSelect({
  multiple,
  items = [],
  selected,
  onValueChange,
  autoFocus = false,
  disabled = false,
  ariaDescribedby,
  ariaPlaceholder,
  onFocus,
  onBlur,
  className,
}: Readonly<FancyMultiSelectProps>): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const selectedItems = useMemo(
    () => items.filter((item) => selected.some((selectedValue) => isEqual(item.value, selectedValue))),
    [items, selected]
  );

  const selectables = useMemo(
    () => items.filter((framework) => !selectedItems.some((item) => isEqual(item.value, framework.value))),
    [items, selectedItems]
  );

  const handleUnselect = useCallback(
    (framework: FancySelectItem) => {
      if (disabled) {
        return;
      }
      const newSelected = selectedItems.filter((s) => !isEqual(s.value, framework.value));
      onValueChange?.(newSelected.map((item) => item.index));
    },
    [disabled, selectedItems, onValueChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!inputRef.current || inputRef.current.value !== '') {
        return;
      }
      if (disabled) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const newSelected = selectedItems.slice(0, -1);
        onValueChange?.(newSelected.map((item) => item.index));
      } else if (e.key === 'Escape') {
        inputRef.current.blur();
      }
    },
    [disabled, selectedItems, onValueChange]
  );

  const handleSelect = useCallback(
    (item: FancySelectItem) => {
      if (disabled) {
        return;
      }
      setInputValue('');
      const newSelected = multiple ? [...selectedItems, item] : [item];
      onValueChange?.(newSelected.map((item) => item.index));
    },
    [disabled, multiple, selectedItems, onValueChange]
  );

  return (
    <Command
      disablePointerSelection={disabled}
      onKeyDown={handleKeyDown}
      className={cn('overflow-visible bg-transparent', className)}
      autoFocus={autoFocus}
      aria-disabled={disabled}
      onBlur={onBlur}
      onFocus={onFocus}
      aria-describedby={ariaDescribedby}
      aria-placeholder={ariaPlaceholder}
    >
      <div className='group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1'>
        <div className='flex gap-1 flex-wrap'>
          {selectedItems.map((item) => (
            <Badge key={uuidv4()} variant='secondary'>
              {item.label}
              <button
                type='button'
                className='rtl:mr-1 ltr:ml-1 ring-offset-background rounded-full outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1'
                onKeyDown={(e) => e.key === 'Enter' && handleUnselect(item)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  if (disabled) {
                    return;
                  }
                  handleUnselect(item);
                }}
              >
                <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
              </button>
            </Badge>
          ))}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            disabled={disabled}
            placeholder='Select ...'
            className='rtl:mr-2 ltr:ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1'
          />
        </div>
      </div>
      {open && selectables.length > 0 && (
        <div className='relative mt-2'>
          <div className='absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in'>
            <CommandGroup className='h-full overflow-auto'>
              <CommandList>
                {selectables.map((item) => (
                  <CommandItem
                    disabled={item.disabled || disabled}
                    key={uuidv4()}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => handleSelect(item)}
                    className='cursor-pointer'
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </div>
        </div>
      )}
    </Command>
  );
}
