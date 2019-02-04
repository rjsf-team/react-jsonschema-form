import React from 'react';
import { expect } from 'chai';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import TelephoneWidget from '../src/components/widgets/TelephoneWidget';

describe('Display country code', () => {
  configure({ adapter: new Adapter() });

  it('renders telephone code', () => {
    const props = {
      options: { countryCode: '+62' },
      registry: { widgets: { BaseInput: 'div' } }
    };

    const wrapper = mount(<TelephoneWidget {...props}/>);
    expect(wrapper.contains('+62')).to.equal(true);
  });
});
