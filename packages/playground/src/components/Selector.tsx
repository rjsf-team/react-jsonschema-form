import { memo, useState, type MouseEvent } from 'react';
import { type Sample, samples } from '../samples';

const Selector: React.FC<{ onSelected: (data: any) => void }> = memo(({ onSelected }) => {
  const [current, setCurrent] = useState<Sample>('Simple');

  function onLabelClick(label: Sample) {
    return (event: MouseEvent) => {
      event.preventDefault();
      setCurrent(label);
      setTimeout(() => onSelected(samples[label]), 0);
    };
  }

  return (
    <ul className='nav nav-pills'>
      {Object.keys(samples).map((label, i) => {
        return (
          <li key={i} role='presentation' className={current === label ? 'active' : ''}>
            <a href='#' onClick={onLabelClick(label as Sample)}>
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
});

export default Selector;
