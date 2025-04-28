import { forwardRef } from 'react';
import { Slider as ChakraSlider, HStack } from '@chakra-ui/react';

export interface SliderProps extends ChakraSlider.RootProps {
  marks?: Array<number | { value: number; label: React.ReactNode }>;
  showValue?: boolean;
}

/**
 * Slider component that allows users to select a value from a range.
 *
 * @param {SliderProps} props - The properties for the slider component.
 * @param {Array<number | { value: number; label: React.ReactNode }>} [props.marks] - The marks to display on the slider.
 * @param {React.ReactNode} [props.label] - The label for the slider.
 * @param {boolean} [props.showValue] - Whether to show the current value of the slider.
 * @returns {JSX.Element} The rendered slider component.
 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(props, ref) {
  const { marks: marksProp, showValue, ...rest } = props;
  const value = props.defaultValue ?? props.value;

  const marks = marksProp?.map((mark) => {
    if (typeof mark === 'number') {
      return { value: mark, label: undefined };
    }
    return mark;
  });

  const hasMarkLabel = !!marks?.some((mark) => mark.label);

  return (
    <ChakraSlider.Root ref={ref} width='200px' thumbAlignment='center' {...rest}>
      {showValue && (
        <HStack justify='space-between'>
          <ChakraSlider.ValueText />
        </HStack>
      )}
      <ChakraSlider.Control data-has-mark-label={hasMarkLabel || undefined}>
        <ChakraSlider.Track>
          <ChakraSlider.Range />
        </ChakraSlider.Track>
        <SliderThumbs value={value} />
        <SliderMarks marks={marks} />
      </ChakraSlider.Control>
    </ChakraSlider.Root>
  );
});

/**
 * SliderThumbs component that renders the thumbs for the slider.
 *
 * @param {Object} props - The properties for the slider thumbs component.
 * @param {number[]} [props.value] - The values for the thumbs.
 * @returns {JSX.Element} The rendered slider thumbs component.
 */
function SliderThumbs(props: { value?: number[] }) {
  const { value } = props;
  return (
    <>
      {value?.map((_, index) => (
        <ChakraSlider.Thumb key={index} index={index}>
          <ChakraSlider.HiddenInput />
        </ChakraSlider.Thumb>
      ))}
    </>
  );
}

interface SliderMarksProps {
  marks?: Array<number | { value: number; label: React.ReactNode }>;
}

/**
 * SliderMarks component that renders the marks for the slider.
 *
 * @param {SliderMarksProps} props - The properties for the slider marks component.
 * @param {Array<number | { value: number; label: React.ReactNode }>} [props.marks] - The marks to display on the slider.
 * @returns {JSX.Element | null} The rendered slider marks component or null if no marks are provided.
 */
const SliderMarks = forwardRef<HTMLDivElement, SliderMarksProps>(function SliderMarks(props, ref) {
  const { marks } = props;
  if (!marks?.length) {
    return null;
  }

  return (
    <ChakraSlider.MarkerGroup ref={ref}>
      {marks.map((mark, index) => {
        const value = typeof mark === 'number' ? mark : mark.value;
        const label = typeof mark === 'number' ? undefined : mark.label;
        return (
          <ChakraSlider.Marker key={index} value={value}>
            <ChakraSlider.MarkerIndicator />
            {label}
          </ChakraSlider.Marker>
        );
      })}
    </ChakraSlider.MarkerGroup>
  );
});
