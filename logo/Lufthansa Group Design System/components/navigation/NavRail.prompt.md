One-sentence: Slim left icon-rail navigation (the Lufthansa brand-portal pattern); active item lifts to a white pill.

```jsx
<NavRail active={view} onChange={setView} items={[
  {value:'home', label:'Home', icon:'ph-house'},
  {value:'flights', label:'Flights', icon:'ph-airplane-tilt'},
  {value:'profile', label:'Profile', icon:'ph-user'},
]} />
```
Pass Phosphor light classes as `icon`. ~120px wide (`--nav-rail-width`).
