import { useCallback, useEffect } from 'react';

const useEmptyValueOnChange = ({ onChange, options, value }) => {
  const mergeValues = useCallback((newValue) => {
    return newValue === "" && options?.emptyValue ? options?.emptyValue : newValue;
  }, [options]);

  const rawOnChange = useCallback((newValue) => {
    return onChange(mergeValues(newValue));
  }, [onChange, mergeValues]);

  const eventOnChange = useCallback((event) => {
    const newValue = event?.target?.value;
    return rawOnChange(newValue);
  }, [rawOnChange]);

  useEffect(() => {
    if (value === mergeValues(value)){
      return;
    }
    console.log(`calling onChange with ${mergeValues(value)}`);
    rawOnChange(mergeValues(value));
  }, [rawOnChange, mergeValues, value]);

  return {
    eventOnChange
  };
};

export default useEmptyValueOnChange;
