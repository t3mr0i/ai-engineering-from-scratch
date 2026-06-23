/* global React */
const { Button, Badge } = window.LufthansaGroupDesignSystem_70bbed;

function Hero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--lhg-core-blue)', color: '#fff' }}>
      {/* horizon arc + glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', right: '-12%', top: '-30%', width: '70%', height: '160%',
          background: 'radial-gradient(circle at 35% 50%, rgba(63,115,216,.55), rgba(5,22,77,0) 62%)' }} />
        <div style={{ position: 'absolute', left: '-10%', bottom: '-120%', width: '120%', height: '180%',
          borderTop: '1px solid rgba(255,255,255,.30)', borderRadius: '50%' }} />
      </div>
      <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '110px 40px 120px' }}>
        <Badge tone="blue" icon="ph-leaf">Connecting a sustainable world</Badge>
        <h1 style={{ font: '200 clamp(48px,6.5vw,88px)/1.02 var(--font-display)', letterSpacing: '-.02em',
          color: '#fff', margin: '26px 0 0', maxWidth: 820 }}>
          Shaping the future<br />of aviation.
        </h1>
        <p style={{ font: '300 21px/1.6 var(--font-body)', color: 'rgba(255,255,255,.82)', maxWidth: 540, margin: '24px 0 0' }}>
          We are connecting people, cultures and economies in a responsible way — across five airlines and more than
          250 destinations worldwide.
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 38 }}>
          <Button variant="accent" iconRight={<i className="ph-light ph-arrow-right" />}>Discover the Group</Button>
          <Button variant="on-dark">Our responsibility</Button>
        </div>
      </div>
    </section>
  );
}
window.Hero = Hero;
