One-sentence: A fare/cabin pricing card listing included perks (check/cross), with a featured highlight and selected state.

```jsx
<FareCard name="Economy Flex" price="742" featured
  perks={[{label:'Rebooking',included:true},{label:'Checked bag',included:true},{label:'Seat choice',included:false}]}
  selected={fare==='flex'} onSelect={()=>setFare('flex')} />
```
