/* global React */
const { Stat } = window.LufthansaGroupDesignSystem_70bbed;

function StatBand() {
  const stats = [
    { value: '5', label: 'Passenger airlines' },
    { value: '250', unit: '+', label: 'Destinations worldwide' },
    { value: '1.673', unit: 'Mio €', label: 'Adjusted EBIT 2024' },
    { value: '30', unit: '%', label: 'Less CO₂ on new aircraft' },
  ];
  return (
    <section style={{ background: '#fff', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '54px 40px',
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ borderLeft: i ? '1px solid var(--border-subtle)' : 'none', paddingLeft: i ? 32 : 0 }}>
            <div style={{ font: '200 52px/1 var(--font-display)', letterSpacing: '-.02em', color: 'var(--lhg-core-blue)' }}>
              {s.value}<span style={{ fontSize: 20, color: 'var(--lhg-blue-500)', marginLeft: 4 }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 300, color: 'var(--text-secondary)', marginTop: 10 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
window.StatBand = StatBand;
