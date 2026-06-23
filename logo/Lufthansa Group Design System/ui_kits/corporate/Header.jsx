/* global React */
const { IconButton } = window.LufthansaGroupDesignSystem_70bbed;

function Header({ tab, setTab }) {
  const links = ['Group', 'Responsibility', 'Investors', 'Newsroom', 'Careers'];
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', height: 76,
        display: 'flex', alignItems: 'center', gap: 40 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); setTab('Group'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 'none' }}>
          <img src="../../assets/logos/lh-crane.svg" alt="" style={{ height: 26 }} />
          <img src="../../assets/logos/lhg-lockup.svg" alt="Lufthansa Group" style={{ height: 15 }} />
        </a>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {links.map((l) => (
            <button key={l} onClick={() => setTab(l)} style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              font: '300 15.5px var(--font-body)', padding: '8px 14px', borderRadius: 'var(--radius-pill)',
              color: tab === l ? 'var(--lhg-blue-500)' : 'var(--lhg-core-blue)',
              transition: 'color var(--dur-fast)',
            }}
            onMouseEnter={(e) => { if (tab !== l) e.currentTarget.style.color = 'var(--lhg-blue-500)'; }}
            onMouseLeave={(e) => { if (tab !== l) e.currentTarget.style.color = 'var(--lhg-core-blue)'; }}>
              {l}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
          <IconButton icon="ph-magnifying-glass" label="Search" />
          <IconButton icon="ph-globe" label="Language" />
        </div>
      </div>
    </header>
  );
}
window.Header = Header;
