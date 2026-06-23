One-sentence: A flight search-result row with times, route line, stops and price; toggles to a selected state.

```jsx
<FlightCard depTime="10:25" arrTime="13:05" from="FRA" to="JFK"
  duration="8h 40m" stops="Direct" flightNo="LH 400" price="612"
  selected={sel==='lh400'} onSelect={()=>setSel('lh400')} />
```
