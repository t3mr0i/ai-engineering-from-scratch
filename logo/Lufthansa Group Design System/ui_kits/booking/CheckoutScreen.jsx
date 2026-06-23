/* global React */
const { Input, Select, Checkbox, Button, Card, Switch, Divider, FareCard } = window.LufthansaGroupDesignSystem_70bbed;

function CheckoutScreen({ onConfirm, onBack }) {
  const [fare, setFare] = React.useState('flex');
  const [green, setGreen] = React.useState(true);
  const base = 612, flexUp = fare === 'flex' ? 130 : 0, greenAdd = green ? 18 : 0;
  const total = base + flexUp + greenAdd;
  return (
    <section style={{ maxWidth: 1080, margin: '0 auto', padding: '32px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>
      <div>
        <button onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--lhg-blue-500)', font: '300 14px var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 14 }}>
          <i className="ph-light ph-arrow-left" /> Back to flights
        </button>
        <h2 style={{ font: '300 30px var(--font-display)', letterSpacing: '-.01em', color: 'var(--lhg-core-blue)', margin: '0 0 22px' }}>Passenger details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Select label="Title" options={['Mr', 'Ms', 'Mx', 'Dr']} />
          <div />
          <Input label="First name" placeholder="As in passport" />
          <Input label="Last name" placeholder="As in passport" />
          <Input label="Email" type="email" icon="ph-envelope" placeholder="you@example.com" />
          <Input label="Frequent flyer (optional)" icon="ph-identification-card" placeholder="Miles & More no." />
        </div>

        <Divider label="Fare" spacing={28} />
        <div style={{ display: 'flex', gap: 16 }}>
          <FareCard name="Economy Light" price="612" perks={[{ label: 'Carry-on bag', included: true }, { label: 'Checked bag', included: false }, { label: 'Rebooking', included: false }]} selected={fare === 'light'} onSelect={() => setFare('light')} />
          <FareCard name="Economy Flex" price="742" featured perks={[{ label: 'Carry-on bag', included: true }, { label: 'Checked bag', included: true }, { label: 'Free rebooking', included: true }]} selected={fare === 'flex'} onSelect={() => setFare('flex')} />
        </div>

        <Divider label="Add-ons" spacing={28} />
        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <i className="ph-light ph-leaf" style={{ fontSize: 26, color: 'var(--lhg-teal)' }} />
            <div>
              <div style={{ font: '400 16px var(--font-body)', color: 'var(--lhg-core-blue)' }}>Green Fare — fly more sustainable</div>
              <div style={{ font: '300 14px var(--font-body)', color: 'var(--text-muted)' }}>20% SAF + 80% verified offset · €18</div>
            </div>
          </div>
          <Switch checked={green} onChange={setGreen} />
        </Card>
      </div>

      {/* Summary rail */}
      <aside style={{ position: 'sticky', top: 110 }}>
        <Card elevated>
          <div style={{ font: '500 12px var(--font-body)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--lhg-blue-500)', marginBottom: 14 }}>Your trip</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <i className="ph-light ph-airplane-tilt" style={{ fontSize: 20, color: 'var(--lhg-blue-500)' }} />
            <span style={{ font: '300 17px var(--font-display)', color: 'var(--lhg-core-blue)' }}>FRA → JFK</span>
          </div>
          <div style={{ font: '300 14px var(--font-body)', color: 'var(--text-muted)', marginBottom: 16 }}>Wed 24 Jun · 10:25 · LH 400 · Direct</div>
          <Divider spacing={14} />
          {[['Base fare', `€${base}`], [fare === 'flex' ? 'Economy Flex' : 'Economy Light', flexUp ? `€${flexUp}` : '—'], ['Green Fare', greenAdd ? `€${greenAdd}` : '—']].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', font: '300 15px var(--font-body)', color: 'var(--text-secondary)', padding: '6px 0' }}>
              <span>{k}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span>
            </div>
          ))}
          <Divider spacing={14} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <span style={{ font: '400 16px var(--font-body)', color: 'var(--lhg-core-blue)' }}>Total</span>
            <span style={{ font: '200 34px var(--font-display)', color: 'var(--lhg-core-blue)' }}>€{total}</span>
          </div>
          <Button variant="primary" full onClick={onConfirm}>Confirm &amp; pay</Button>
          <p style={{ font: '300 12.5px/1.5 var(--font-body)', color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0 0' }}>Free cancellation within 24 hours</p>
        </Card>
      </aside>
    </section>
  );
}
window.CheckoutScreen = CheckoutScreen;
