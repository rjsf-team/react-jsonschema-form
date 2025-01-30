import { useEffect } from 'react';
import base64 from '../../utils/base64';
import { Sample } from '../../samples/Sample';
import { LiveSettings } from '../Header';

interface UseHashLoadProps {
  load: (data: Sample & { theme: string; liveSettings: LiveSettings }) => void;
  loaded: boolean;
}

export function useHashLoad({ load, loaded }: UseHashLoadProps) {
  useEffect(() => {
    const hash = document.location.hash.match(/#(.*)/);

    if (hash && typeof hash[1] === 'string' && hash[1].length > 0 && !loaded) {
      try {
        const decoded = base64.decode(hash[1]);
        load(JSON.parse(decoded));
      } catch (error) {
        alert('Unable to load form setup data.');
        console.error(error);
      }
    }
  }, [load, loaded]);
}
