import { useState, MouseEvent } from 'react';
import { samples } from '../samples';

interface SelectorProps {
  onSelected: (data: any) => void;
}

export default function Selector({ onSelected }: SelectorProps) {
  const [current, setCurrent] = useState<string>('Simple');

  function onLabelClick(label: string) {
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
            <a href='#' onClick={onLabelClick(label)}>
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
