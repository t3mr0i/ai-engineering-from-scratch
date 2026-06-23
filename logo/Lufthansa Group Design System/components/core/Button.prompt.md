One-sentence: The Lufthansa Group pill button — use for any primary, secondary or text action; sentence-case labels only.

```jsx
<Button variant="primary">Book a flight</Button>
<Button variant="secondary" iconRight={<i className="ph-light ph-arrow-right" />}>Learn more</Button>
<Button variant="tertiary" iconRight={<i className="ph-light ph-arrow-right" />}>See all routes</Button>
```

Variants: `primary` (Core Blue, the default CTA), `accent` (Blue 500), `secondary` (navy outline → fills navy on hover), `ghost` (faint blue tint), `tertiary` (inline text link, no padding), `on-dark` (white outline for use on the navy hero / dark surfaces). Sizes `sm | md | lg`. Hover darkens toward Blue 600 — never scales or bounces. Use `full` to stretch. A passed `style` prop is merged on top. Pair with Phosphor light icons.
