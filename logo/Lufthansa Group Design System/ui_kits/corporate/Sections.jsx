/* global React */
const { Button, Input } = window.LufthansaGroupDesignSystem_70bbed;

function Quote() {
  return (
    <section style={{ background: 'var(--lhg-grey-200)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '96px 40px', textAlign: 'center' }}>
        <img src="../../assets/logos/lh-crane.svg" alt="" style={{ height: 34, marginBottom: 32 }} />
        <p style={{ font: '400 clamp(26px,3.4vw,40px)/1.32 var(--font-serif)', color: 'var(--lhg-core-blue)', margin: 0, letterSpacing: '-.005em' }}>
          “We are connecting people, cultures and economies in a sustainable way.”
        </p>
        <div style={{ font: '500 13px var(--font-body)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 28 }}>
          The Lufthansa Group promise
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--lhg-core-blue)', color: '#fff' }}>
      <div style={{ position: 'absolute', right: '-8%', top: '-60%', width: '55%', height: '220%',
        background: 'radial-gradient(circle, rgba(63,115,216,.5), rgba(5,22,77,0) 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '72px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ font: '200 40px/1.1 var(--font-display)', letterSpacing: '-.02em', color: '#fff', margin: 0 }}>
            Stay close to the Group
          </h2>
          <p style={{ font: '300 17px/1.5 var(--font-body)', color: 'rgba(255,255,255,.8)', margin: '12px 0 0', maxWidth: 420 }}>
            Quarterly results, sustainability updates and newsroom highlights — straight to your inbox.
          </p>
        </div>
        <form style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }} onSubmit={(e) => e.preventDefault()}>
          <div style={{ width: 260 }}>
            <Input label="" placeholder="your.email@company.com" icon="ph-envelope" />
          </div>
          <Button variant="accent">Subscribe</Button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  const cols = {
    Group: ['About us', 'Strategy', 'Brands', 'Fleet'],
    Responsibility: ['Climate', 'People', 'Governance', 'Reports'],
    Investors: ['Share', 'Results', 'Events', 'Bonds'],
    Newsroom: ['Press releases', 'Media library', 'Contacts'],
  };
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 40px 40px',
        display: 'grid', gridTemplateColumns: '1.4fr repeat(4,1fr)', gap: 32 }}>
        <div>
          <img src="../../assets/logos/lhg-lockup.svg" alt="Lufthansa Group" style={{ height: 16 }} />
          <p style={{ font: '300 13.5px/1.6 var(--font-body)', color: 'var(--text-muted)', marginTop: 18, maxWidth: 220 }}>
            Deutsche Lufthansa AG · Frankfurt am Main
          </p>
        </div>
        {Object.entries(cols).map(([h, items]) => (
          <div key={h}>
            <div style={{ font: '500 12px var(--font-body)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--lhg-core-blue)', marginBottom: 14 }}>{h}</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {items.map((it) => <li key={it}><a href="#" style={{ font: '300 14px var(--font-body)', color: 'var(--text-secondary)', textDecoration: 'none' }}>{it}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          font: '300 13px var(--font-body)', color: 'var(--text-muted)' }}>
          <span>© 2025 Deutsche Lufthansa AG</span>
          <span style={{ display: 'flex', gap: 22 }}><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Imprint</a><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Cookie settings</a></span>
        </div>
      </div>
    </footer>
  );
}
window.Quote = Quote; window.CTA = CTA; window.Footer = Footer;
