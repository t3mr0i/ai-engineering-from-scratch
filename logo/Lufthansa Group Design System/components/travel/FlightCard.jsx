import React from 'react';

/** Flight result row — times, route, duration, airline, price + select. */
export function FlightCard({ depTime, arrTime, from, to, duration, stops = 'Direct', airline = 'Lufthansa', flightNo = '', price, currency = '€', onSelect, selected = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 24, background: '#fff',
      border: `1px solid ${selected ? 'var(--lhg-blue-500)' : 'var(--border-subtle)'}`,
      boxShadow: selected ? 'var(--shadow-focus)' : 'var(--shadow-xs)',
      borderRadius: 'var(--radius-lg)', padding: '20px 24px', fontFamily: 'var(--font-body)',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none', width: 120, color: 'var(--lhg-slate-500)' }}>
        <i className="ph-light ph-airplane-tilt" style={{ fontSize: 22, color: 'var(--lhg-blue-500)' }} />
        <div style={{ fontSize: 13, lineHeight: 1.3 }}>{airline}<br /><span style={{ color: 'var(--text-muted)' }}>{flightNo}</span></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: '300 26px var(--font-display)', color: 'var(--lhg-core-blue)', lineHeight: 1 }}>{depTime}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{from}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{duration}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '5px 0' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid var(--lhg-blue-500)', flex: 'none' }} />
            <span style={{ flex: 1, height: 1, background: 'var(--border-strong)' }} />
            <i className="ph-light ph-airplane" style={{ fontSize: 14, color: 'var(--lhg-blue-500)' }} />
            <span style={{ flex: 1, height: 1, background: 'var(--border-strong)' }} />
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--lhg-blue-500)', flex: 'none' }} />
          </div>
          <div style={{ fontSize: 12, color: stops === 'Direct' ? 'var(--lhg-success)' : 'var(--text-muted)' }}>{stops}</div>
        </div>
        <div>
          <div style={{ font: '300 26px var(--font-display)', color: 'var(--lhg-core-blue)', lineHeight: 1 }}>{arrTime}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{to}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        <div><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>from </span><span style={{ font: '300 28px var(--font-display)', color: 'var(--lhg-core-blue)' }}>{currency}{price}</span></div>
        <button onClick={onSelect} style={{
          border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-pill)', padding: '10px 24px',
          background: selected ? 'var(--lhg-blue-500)' : 'var(--lhg-core-blue)', color: '#fff',
          font: '300 15px var(--font-body)',
        }}>{selected ? 'Selected' : 'Select'}</button>
      </div>
    </div>
  );
}
