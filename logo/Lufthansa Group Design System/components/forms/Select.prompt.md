One-sentence: Dropdown select styled to match Input (hairline, 48px, chevron).

```jsx
<Select label="Cabin" value={c} onChange={e=>setC(e.target.value)}
  options={["Economy","Premium Economy","Business","First"]} />
```

Accepts plain strings or `{value,label}` objects.
