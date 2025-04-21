import React, { ComponentProps } from "react";
import { IconButtonProps as RjsfIconButtonProps } from "@rjsf/utils";

const ICON_URL_BASE = "https://cdn.jsdelivr.net/npm/uswds/src/img/usa-icons/";

// Map icon names to their corresponding SVG filenames and default alt text
const iconMap: {
  [key: string]: { filename: string; alt: string };
} = {
  add: { filename: "add.svg", alt: "Add Item" },
  remove: { filename: "remove.svg", alt: "Remove Item" }, // Or close.svg
  "arrow-upward": { filename: "arrow_upward.svg", alt: "Move Item Up" },
  "arrow-downward": { filename: "arrow_downward.svg", alt: "Move Item Down" },
  copy: { filename: "content_copy.svg", alt: "Copy Item" }, // Assuming content_copy.svg exists
  // Add other icons as needed
};

// Define our component's props, extending RJSF's IconButtonProps
// and adding our specific props like iconName and uswdsStyle
interface IconButtonProps extends RjsfIconButtonProps {
  iconName?: keyof typeof iconMap; // Make iconName optional, button might just have text
  uswdsStyle?: "outline" | "unstyled" | "secondary" | "accent-cool" | "base"; // Add more styles as needed
  children?: React.ReactNode; // Allow passing text content like "Add Item"
}

const IconButton = ({
  iconName,
  uswdsStyle,
  className,
  onClick,
  disabled,
  title,
  registry, // Included but not used directly in this basic version
  uiSchema, // Included but not used directly in this basic version
  children,
  icon, // Destructure RJSF's icon/iconType to prevent passing them down
  iconType,
  ...props // Capture rest of the props like style
}: IconButtonProps) => {
  const iconInfo = iconName ? iconMap[iconName] : null;

  // Determine button class
  let buttonClass = "usa-button";
  if (uswdsStyle) {
    buttonClass += ` usa-button--${uswdsStyle}`;
  }
  if (className) {
    buttonClass += ` ${className}`;
  }
  // Add 'usa-button--icon-only' if there's an icon but no children (text)
  if (iconInfo && !children) {
    buttonClass += ` usa-button--icon-only`;
  }

  // Use provided title or default alt text from map
  const buttonTitle = title || (iconInfo ? iconInfo.alt : undefined);

  return (
    <button
      type="button"
      title={buttonTitle}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...props} // Spread additional props like style
    >
      {iconInfo && (
        <img
          src={`${ICON_URL_BASE}${iconInfo.filename}`}
          alt={iconInfo.alt} // Alt text for accessibility, even if hidden
          className="usa-icon"
          aria-hidden="true" // Hide decorative icon from screen readers
          role="img"
        />
      )}
      {children}
    </button>
  );
};

export default IconButton;
