import { DRAWER_WIDTH } from '../components/OptionsDrawer.tsx';

export default function Footer() {
  return (
    <p style={{ textAlign: 'center' }}>
      Powered by <a href='https://github.com/rjsf-team/react-jsonschema-form'>react-jsonschema-form</a>.
      {import.meta.env.VITE_SHOW_NETLIFY_BADGE === 'true' && (
        <div style={{ position: 'absolute', right: DRAWER_WIDTH, bottom: 0 }}>
          <a href='https://www.netlify.com'>
            <img src='https://www.netlify.com/img/global/badges/netlify-color-accent.svg' alt='Netlify' />
          </a>
        </div>
      )}
    </p>
  );
}
