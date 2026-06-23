One-sentence: Quiet white content card — hairline border by default, soft blue shadow when elevated.

```jsx
<Card elevated>
  <Card.Eyebrow>Sustainability</Card.Eyebrow>
  <Card.Title>Fly more sustainable today</Card.Title>
  <Card.Body>Offset your journey with verified SAF contributions at checkout.</Card.Body>
</Card>
```

`elevated` swaps border for `--shadow-md`. `pad` = sm|md|lg. Radius is 20px (lg). Never combine heavy shadow + border.
