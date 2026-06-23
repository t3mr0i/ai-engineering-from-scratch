/* global React */
const { FlightCard, Button, Badge, Divider } = window.LufthansaGroupDesignSystem_70bbed;

function ResultsScreen({ onSelect, onBack }) {
  const [sel, setSel] = React.useState('lh400');
  const flights = [
    { id: 'lh400', depTime: '10:25', arrTime: '13:05', from: 'FRA', to: 'JFK', duration: '8h 40m', stops: 'Direct', airline: 'Lufthansa', flightNo: 'LH 400', price: '612' },
    { id: 'lx18', depTime: '07:15', arrTime: '11:30', from: 'FRA', to: 'JFK', duration: '9h 15m', stops: '1 stop · ZRH', airline: 'SWISS', flightNo: 'LX 18', price: '548' },
    { id: 'os89', depTime: '14:50', arrTime: '18:10', from: 'FRA', to: 'JFK', duration: '8h 20m', stops: 'Direct', airline: 'Austrian', flightNo: 'OS 89', price: '689' },
  ];
  return (
    <section style={{ maxWidth: 1080, margin: '0 auto', padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <button onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--lhg-blue-500)', font: '300 14px var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 8 }}>
            <i className="ph-light ph-arrow-left" /> Edit search
          </button>
          <h2 style={{ font: '300 32px var(--font-display)', letterSpacing: '-.01em', color: 'var(--lhg-core-blue)', margin: 0 }}>
            Frankfurt → New York
          </h2>
          <p style={{ font: '300 15px var(--font-body)', color: 'var(--text-muted)', margin: '6px 0 0' }}>Wed 24 Jun · 1 Adult · Economy</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge tone="blue" icon="ph-funnel">3 results</Badge>
          <Badge tone="teal" icon="ph-leaf">Green fares available</Badge>
        </div>
      </div>
      <Divider spacing={20} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {flights.map((f) => (
          <FlightCard key={f.id} {...f} selected={sel === f.id} onSelect={() => setSel(f.id)} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
        <Button variant="primary" size="lg" onClick={onSelect} iconRight={<i className="ph-light ph-arrow-right" />}>Continue to passengers</Button>
      </div>
    </section>
  );
}
window.ResultsScreen = ResultsScreen;
