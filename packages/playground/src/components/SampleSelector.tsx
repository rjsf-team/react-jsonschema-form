import { MouseEvent } from 'react';
import { samples } from '../samples';

export interface SampleSelectorProps {
  onSelected: (sampleName: string) => void;
  selectedSample: string;
}

export default function SampleSelector({ onSelected, selectedSample }: SampleSelectorProps) {
  function onLabelClick(label: string) {
    return (event: MouseEvent) => {
      event.preventDefault();
      setTimeout(() => onSelected(label), 0);
    };
  }

  return (
    <ul className='nav nav-pills'>
      {Object.keys(samples).map((label, i) => {
        return (
          <li key={i} role='presentation' className={selectedSample === label ? 'active' : ''}>
            <a href='#' onClick={onLabelClick(label)}>
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
