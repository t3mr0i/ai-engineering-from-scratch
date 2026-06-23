/* global React */
const { Dialog } = window.LufthansaGroupDesignSystem_70bbed;

function ConfirmDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Booking confirmed" primaryLabel="View e-ticket" secondaryLabel="" width={420} onPrimary={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
        <span style={{ width: 56, height: 56, borderRadius: '50%', background: '#e2f3ea', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
          <i className="ph-light ph-check" style={{ fontSize: 30, color: 'var(--lhg-success)' }} />
        </span>
        <span>Your flight <b style={{ fontWeight: 500, color: 'var(--lhg-core-blue)' }}>FRA → JFK</b> on Wed 24 Jun is booked. We have sent your e-ticket and booking code <b style={{ fontWeight: 500, color: 'var(--lhg-core-blue)' }}>LH4XK2</b> to your email.</span>
      </div>
    </Dialog>
  );
}
window.ConfirmDialog = ConfirmDialog;
