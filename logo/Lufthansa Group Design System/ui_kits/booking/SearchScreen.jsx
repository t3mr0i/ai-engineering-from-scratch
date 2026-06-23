/* global React */
const { SegmentedControl, Input, Select, Button } = window.LufthansaGroupDesignSystem_70bbed;

function SearchScreen({ onSearch }) {
  const [trip, setTrip] = React.useState('Return');
  return (
    <div>
      {/* Blue search hero */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--lhg-core-blue)' }}>
        <div style={{ position: 'absolute', right: '-10%', top: '-50%', width: '60%', height: '200%',
          background: 'radial-gradient(circle at 40% 50%, rgba(63,115,216,.5), rgba(5,22,77,0) 62%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: '56px 32px 90px' }}>
          <h1 style={{ font: '200 46px/1.05 var(--font-display)', letterSpacing: '-.02em', color: '#fff', margin: 0 }}>
            Where would you like to go?
          </h1>
          <p style={{ font: '300 18px var(--font-body)', color: 'rgba(255,255,255,.8)', margin: '14px 0 0' }}>
            Book across Lufthansa, SWISS, Austrian, Brussels and Eurowings.
          </p>
        </div>
      </section>

      {/* Floating search card */}
      <section style={{ maxWidth: 1080, margin: '-56px auto 0', padding: '0 32px', position: 'relative', zIndex: 5 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <SegmentedControl options={['Return', 'One way', 'Multi-city']} value={trip} onChange={setTrip} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 14, alignItems: 'flex-end' }}>
            <Input label="From" icon="ph-airplane-takeoff" placeholder="Frankfurt (FRA)" />
            <Input label="To" icon="ph-airplane-landing" placeholder="New York (JFK)" />
            <Input label="Departure" icon="ph-calendar-blank" placeholder="24 Jun 2026" />
            <Select label="Passengers" options={['1 Adult', '2 Adults', '2 Adults · 1 Child', 'Family (4)']} />
            <Button variant="accent" size="lg" onClick={onSearch} iconRight={<i className="ph-light ph-magnifying-glass" />}>Search</Button>
          </div>
        </div>
      </section>

      {/* Promo strip */}
      <section style={{ maxWidth: 1080, margin: '40px auto 0', padding: '0 32px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { ic: 'ph-leaf', t: 'Fly more sustainable', b: 'Add Green Fares and support SAF at checkout.' },
            { ic: 'ph-seat', t: 'Choose your cabin', b: 'Economy to First — comfort for every journey.' },
            { ic: 'ph-shield-check', t: 'Flexible by default', b: 'Free rebooking on most fares, up to 24h before.' },
          ].map((c, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              <i className={`ph-light ${c.ic}`} style={{ fontSize: 30, color: 'var(--lhg-blue-500)' }} />
              <h3 style={{ font: '300 20px var(--font-display)', color: 'var(--lhg-core-blue)', margin: '14px 0 6px' }}>{c.t}</h3>
              <p style={{ font: '300 14.5px/1.55 var(--font-body)', color: 'var(--text-secondary)', margin: 0 }}>{c.b}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
window.SearchScreen = SearchScreen;
