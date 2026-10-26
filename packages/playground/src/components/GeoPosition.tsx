import { useState } from 'react';
import type { FieldProps } from '@rjsf/utils';
import { partId } from '@rjsf/utils';

export default function GeoPosition({ id }: FieldProps) {
  const [lat, setLat] = useState<number>(0);
  const [lon, setLon] = useState<number>(0);

  return (
    <div className='geo'>
      <h3>Hey, I&apos;m a custom component</h3>
      <p>
        I&apos;m registered as <code>geo</code> and referenced in
        <code>uiSchema</code> as the <code>ui:field</code> to use for this schema.
      </p>
      <div className='row'>
        <div className='col-sm-6'>
          <label htmlFor={partId(id, 'geoLat')}>Latitude</label>
          <input
            id={partId(id, 'geoLat')}
            className='form-control'
            type='number'
            value={lat}
            step='0.00001'
            onChange={(e) => setLat(parseFloat(e.target.value))}
          />
        </div>
        <div className='col-sm-6'>
          <label htmlFor={partId(id, 'geoLon')}>Longitude</label>
          <input
            id={partId(id, 'geoLon')}
            className='form-control'
            type='number'
            value={lon}
            step='0.00001'
            onChange={(e) => setLon(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
