import { useState, MouseEvent } from 'react';
import { Sample, samples } from '../samples';

interface SelectorProps {
  onSelected: (data: any) => void;
}

export default function Selector({ onSelected }: SelectorProps) {
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
}
