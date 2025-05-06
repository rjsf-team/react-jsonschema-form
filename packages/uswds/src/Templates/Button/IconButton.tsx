import React from 'react';
import { IconButtonProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Button } from '@trussworks/react-uswds';

// Helper to get a string representation for aria-label if it's an element
const getAriaLabel = (label: React.ReactNode): string | undefined => {
  if (typeof label === 'string') {
    return label;
  }
  // Add more sophisticated logic here if needed to extract text from React elements
  return undefined;
};

// Map icon names or classes to button types
const ICON_MAP = {
  'arrow-up': 'arrow_upward',
  'arrow-down': 'arrow_downward',
  remove: 'delete',
  plus: 'add',
};

export default function IconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const { icon, iconType, className, uiSchema, registry, ...otherProps } = props;
  const translatedIcon = ICON_MAP[icon as keyof typeof ICON_MAP] || icon; // Translate generic icon name

  return (
    <Button
      type="button"
      unstyled // Use unstyled for icon-only buttons in arrays typically
      {...otherProps} // Passes disabled, readonly, onClick, etc.
      className={`usa-button--icon-only ${className || ''}`} // Base class + any custom class
      aria-label={getAriaLabel(otherProps.title)} // Ensure aria-label is a string
    >
      {/* Render USWDS Icon component or use appropriate class */}
      {/* Example using a hypothetical Icon component */}
      {/* <Icon name={translatedIcon} aria-hidden="true" /> */}
      {/* Example using CSS class */}
      <span className={`usa-icon usa-icon--${translatedIcon}`} aria-hidden="true"></span>
      <span className="usa-sr-only">{otherProps.title}</span> {/* Screen reader text */}
    </Button>
  );
}
