One-sentence: Centered modal dialog with a navy scrim; composes the DS Button for actions.

```jsx
<Dialog open={open} onClose={()=>setOpen(false)} title="Cancel this booking?"
  primaryLabel="Yes, cancel" onPrimary={cancel}>
  Your fare is non-refundable. This cannot be undone.
</Dialog>
```
Click the scrim or the × to dismiss. Pass `secondaryLabel=""` to hide the cancel button.
