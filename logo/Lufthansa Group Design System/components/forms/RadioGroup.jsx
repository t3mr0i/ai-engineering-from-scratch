import React from 'react';

/** Radio group. Brand-blue selected dot, vertical or horizontal. */
export function RadioGroup({ name, options = [], value, onChange, direction = 'column' }) {
  return (
    <div role="radiogroup" style={{ display: 'flex', flexDirection: direction, gap: direction === 'row' ? 24 : 14, fontFamily: 'var(--font-body)' }}>
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        const on = val === value;
        return (
          <label key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <span style={{
              width: 20, height: 20, flex: 'none', borderRadius: '50%',
              border: `1.5px solid ${on ? 'var(--lhg-blue-500)' : 'var(--border-strong)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color var(--dur-fast)',
            }}>
              {on && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--lhg-blue-500)' }} />}
            </span>
            <input type="radio" name={name} value={val} checked={on} onChange={() => onChange && onChange(val)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--lhg-core-blue)' }}>{lab}</span>
          </label>
        );
      })}
    </div>
  );
}
