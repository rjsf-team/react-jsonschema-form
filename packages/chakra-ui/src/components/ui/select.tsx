import { forwardRef, RefObject } from 'react';
import type { CollectionItem } from '@chakra-ui/react';
import { Select as ChakraSelect, Portal } from '@chakra-ui/react';

import { CloseButton } from './close-button';

interface SelectTriggerProps extends ChakraSelect.ControlProps {
  clearable?: boolean;
}

/**
 * SelectTrigger component that renders a trigger for the select component.
 *
 * @param {SelectTriggerProps} props - The properties for the select trigger component.
 * @param {boolean} [props.clearable] - Whether the trigger is clearable.
 * @param {ReactNode} [props.children] - The content to display inside the trigger.
 * @returns {JSX.Element} The rendered select trigger component.
 */
export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(function SelectTrigger(props, ref) {
  const { children, clearable, ...rest } = props;
  return (
    <ChakraSelect.Control {...rest}>
      <ChakraSelect.Trigger ref={ref}>{children}</ChakraSelect.Trigger>
      <ChakraSelect.IndicatorGroup>
        {clearable && <SelectClearTrigger />}
        <ChakraSelect.Indicator />
      </ChakraSelect.IndicatorGroup>
    </ChakraSelect.Control>
  );
});

/**
 * SelectClearTrigger component that renders a clear button for the select component.
 *
 * @param {ChakraSelect.ClearTriggerProps} props - The properties for the clear trigger component.
 * @returns {JSX.Element} The rendered select clear trigger component.
 */
const SelectClearTrigger = forwardRef<HTMLButtonElement, ChakraSelect.ClearTriggerProps>(
  function SelectClearTrigger(props, ref) {
    return (
      <ChakraSelect.ClearTrigger asChild {...props} ref={ref}>
        <CloseButton size='xs' variant='plain' focusVisibleRing='inside' focusRingWidth='2px' pointerEvents='auto' />
      </ChakraSelect.ClearTrigger>
    );
  },
);

interface SelectContentProps extends ChakraSelect.ContentProps {
  portalled?: boolean;
  portalRef?: RefObject<HTMLElement>;
}

/**
 * SelectContent component that renders the content of the select component.
 *
 * @param {SelectContentProps} props - The properties for the select content component.
 * @param {boolean} [props.portalled] - Whether to use a portal for rendering the content.
 * @param {RefObject<HTMLElement>} [props.portalRef] - The ref for the portal container.
 * @returns {JSX.Element} The rendered select content component.
 */
export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(function SelectContent(props, ref) {
  const { portalled = true, portalRef, ...rest } = props;
  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ChakraSelect.Positioner>
        <ChakraSelect.Content {...rest} ref={ref} />
      </ChakraSelect.Positioner>
    </Portal>
  );
});

/**
 * SelectItem component that represents an item in the select component.
 *
 * @param {SelectItemProps} props - The properties for the select item component.
 * @param {CollectionItem} [props.item] - The item to display in the select.
 * @param {ReactNode} [props.children] - The content to display inside the item.
 * @returns {JSX.Element} The rendered select item component.
 */
export const SelectItem = forwardRef<HTMLDivElement, ChakraSelect.ItemProps>(function SelectItem(props, ref) {
  const { item, children, ...rest } = props;
  return (
    <ChakraSelect.Item key={item.value} item={item} {...rest} ref={ref}>
      {children}
      <ChakraSelect.ItemIndicator />
    </ChakraSelect.Item>
  );
});

interface SelectValueTextProps extends Omit<ChakraSelect.ValueTextProps, 'children'> {
  children?(items: CollectionItem[]): React.ReactNode;
}

/**
 * SelectValueText component that displays the selected value in the select component.
 *
 * @param {SelectValueTextProps} props - The properties for the select value text component.
 * @param {function} [props.children] - A function that receives the selected items and returns the content to display.
 * @param {ReactNode} [props.placeholder] - The placeholder text to display when no items are selected.
 * @returns {JSX.Element} The rendered select value text component.
 */
export const SelectValueText = forwardRef<HTMLSpanElement, SelectValueTextProps>(function SelectValueText(props, ref) {
  const { children, ...rest } = props;
  return (
    <ChakraSelect.ValueText {...rest} ref={ref}>
      <ChakraSelect.Context>
        {(select) => {
          const items = select.selectedItems;
          if (items.length === 0) {
            return props.placeholder;
          }
          if (children) {
            return children(items);
          }
          if (items.length === 1) {
            return select.collection.stringifyItem(items[0]);
          }
          return `${items.length} selected`;
        }}
      </ChakraSelect.Context>
    </ChakraSelect.ValueText>
  );
});

/**
 * SelectRoot component that serves as the root element for the select component.
 *
 * @param {SelectRootProps} props - The properties for the select root component.
 * @param {ChakraSelect.PositioningProps} [props.positioning] - The positioning properties for the select component.
 * @param {ReactNode} [props.children] - The content to display inside the select root.
 * @returns {JSX.Element} The rendered select root component.
 */
export const SelectRoot = forwardRef<HTMLDivElement, ChakraSelect.RootProps>(function SelectRoot(props, ref) {
  return (
    <ChakraSelect.Root {...props} ref={ref} positioning={{ sameWidth: true, ...props.positioning }}>
      {props.asChild ? (
        props.children
      ) : (
        <>
          <ChakraSelect.HiddenSelect />
          {props.children}
        </>
      )}
    </ChakraSelect.Root>
  );
}) as ChakraSelect.RootComponent;

interface SelectItemGroupProps extends ChakraSelect.ItemGroupProps {
  label: React.ReactNode;
}

/**
 * SelectItemGroup component that groups select items together.
 *
 * @param {SelectItemGroupProps} props - The properties for the select item group component.
 * @param {React.ReactNode} [props.label] - The label for the item group.
 * @param {ReactNode} [props.children] - The content to display inside the item group.
 * @returns {JSX.Element} The rendered select item group component.
 */
export const SelectItemGroup = forwardRef<HTMLDivElement, SelectItemGroupProps>(function SelectItemGroup(props, ref) {
  const { children, label, ...rest } = props;
  return (
    <ChakraSelect.ItemGroup {...rest} ref={ref}>
      <ChakraSelect.ItemGroupLabel>{label}</ChakraSelect.ItemGroupLabel>
      {children}
    </ChakraSelect.ItemGroup>
  );
});

export const SelectLabel = ChakraSelect.Label;
export const SelectItemText = ChakraSelect.ItemText;
