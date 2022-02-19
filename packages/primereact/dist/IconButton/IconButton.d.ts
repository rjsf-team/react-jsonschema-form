declare const mappings: {
    remove: JSX.Element;
    plus: JSX.Element;
    "arrow-up": JSX.Element;
    "arrow-down": JSX.Element;
};
declare type IconButtonProps = {
    icon: keyof typeof mappings;
    className?: string;
    tabIndex?: number;
    style?: any;
    disabled?: any;
    onClick?: any;
};
declare const IconButton: (props: IconButtonProps) => JSX.Element;
export default IconButton;
