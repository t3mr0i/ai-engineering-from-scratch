/* global React */
const { Card, Badge, Button } = window.LufthansaGroupDesignSystem_70bbed;

function StoryGrid() {
  const stories = [
    { img: '../../assets/photography/turquoise-phone.jpg', tag: 'Innovation', tone: 'blue',
      title: 'Aviation revolutionized by technology', body: 'How digital cabins and AI-assisted operations are reshaping every journey.' },
    { img: '../../assets/photography/portrait-red.webp', tag: 'People', tone: 'purple',
      title: 'The people who keep us flying', body: 'More than 100,000 colleagues across the Group, trained to the highest standards.' },
    { img: '../../assets/photography/magenta-portrait.webp', tag: 'Responsibility', tone: 'teal',
      title: 'Fly more sustainable today', body: 'Sustainable aviation fuel and a renewed fleet on the path to net zero by 2050.' },
  ];
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <div style={{ font: '500 12px var(--font-body)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--lhg-blue-500)' }}>Stories</div>
          <h2 style={{ font: '300 38px/1.1 var(--font-display)', letterSpacing: '-.01em', color: 'var(--lhg-core-blue)', margin: '12px 0 0' }}>
            Taking travel to new heights
          </h2>
        </div>
        <Button variant="tertiary" iconRight={<i className="ph-light ph-arrow-right" />}>All stories</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {stories.map((s, i) => (
          <article key={i} style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.querySelector('img').style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.querySelector('img').style.transform = 'scale(1)'; }}>
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/3', marginBottom: 18 }}>
              <img src={s.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                transition: 'transform var(--dur-slow) var(--ease-out)' }} />
            </div>
            <Badge tone={s.tone}>{s.tag}</Badge>
            <h3 style={{ font: '300 23px/1.25 var(--font-display)', letterSpacing: '-.01em', color: 'var(--lhg-core-blue)', margin: '14px 0 8px' }}>{s.title}</h3>
            <p style={{ font: '300 15.5px/1.55 var(--font-body)', color: 'var(--text-secondary)', margin: 0 }}>{s.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
window.StoryGrid = StoryGrid;
