const UiField: React.FC<{
  schema?: any;
  idSchema: { $id: string };
  formData?: any;
  onChange: (...args: any[]) => void;
  [key: string]: any;
}> = ({ idSchema: { $id }, formData, onChange }) => {
  const changeHandlerFactory = (fieldName: string) => (event: any) => {
    onChange(formData ? { ...formData, [fieldName]: event.target.value } : { [fieldName]: event.target.value });
  };
  return (
    <>
      <h4>Location</h4>
      <div style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            margin: '1rem',
          }}
        >
          <div className='form-group field field-string'>
            <label className='control-label' htmlFor={`${$id}-city`}>
              City
            </label>
            <input
              className='form-control'
              id={`${$id}-city`}
              required={false}
              placeholder=''
              type='text'
              value={formData?.city || ''}
              onChange={changeHandlerFactory('city')}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            margin: '1rem',
          }}
        >
          <div className='form-group field field-string'>
            <label className='control-label' htmlFor={`${$id}-lat`}>
              Latitude
            </label>
            <input
              className='form-control'
              id={`${$id}-lat`}
              type='number'
              value={formData?.lat || 0}
              onChange={changeHandlerFactory('lat')}
            />
          </div>
          <div className='form-group field field-string'>
            <label className='control-label' htmlFor={`${$id}-lon`}>
              Longitude
            </label>
            <input
              className='form-control'
              id={`${$id}-lon`}
              type='number'
              value={formData?.lon || 0}
              onChange={changeHandlerFactory('lon')}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default {
  schema: {
    title: 'Location',
    type: 'object',
    anyOf: [
      {
        title: 'City',
        properties: {
          city: {
            type: 'string',
          },
        },
        required: ['city'],
      },
      {
        title: 'Coordinates',
        properties: {
          lat: {
            type: 'number',
          },
          lon: {
            type: 'number',
          },
        },
        required: ['lat', 'lon'],
      },
    ],
  },
  uiSchema: {
    'ui:field': UiField,
  },
  formData: {},
};
