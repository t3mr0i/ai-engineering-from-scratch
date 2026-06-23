/* global React */
const { Stepper, IconButton } = window.LufthansaGroupDesignSystem_70bbed;

function BookingHeader({ step }) {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px', height: 70, display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="../../assets/logos/lh-crane.svg" alt="" style={{ height: 24 }} />
        <img src="../../assets/logos/lhg-lockup.svg" alt="Lufthansa Group" style={{ height: 13 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <IconButton icon="ph-question" label="Help" />
          <IconButton icon="ph-globe" label="Language" />
          <IconButton icon="ph-user" label="Account" variant="outline" />
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 32px' }}>
          <Stepper steps={['Search', 'Select', 'Passengers', 'Payment']} current={step} />
        </div>
      </div>
    </header>
  );
}
window.BookingHeader = BookingHeader;
