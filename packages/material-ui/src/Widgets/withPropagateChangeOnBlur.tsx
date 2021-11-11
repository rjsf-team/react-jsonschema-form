import React, { useEffect, useState } from "react";

function useStatePreferInitial(initialState: any) {
  const state = useState(initialState);

  useEffect(() => {
    const [value, setValue] = state;

    if (value !== initialState) {
      setValue(initialState);
    }
    // We intentionally	run this effect only on when initialState changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState]);

  return state;
}

export const withPropagateChangeOnBlur = (Component: any) => (props: any) => {
  const [value, setValue] = useStatePreferInitial(props.value);

  return (
    <Component
      {...props}
      value={value}
      onChange={setValue}
      onBlur={(...args: any) => {
        props.onBlur.apply(undefined, args);
        props.onChange(value);
      }}
    />
  );
};
