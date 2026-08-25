---
name: prompt-vision-preprocessing-audit
description: Check an image array against the local HWC, CHW, range, and normalization contract
phase: 4
lesson: 1
---

# Vision preprocessing audit

Use this handoff with the dictionary returned by `inspect_image` and the output of `code/main.py`.

1. Record the raw `shape`, `dtype`, `[min,max]`, and three channel means.
2. Confirm that a raw fixture is HWC `(H,W,3)` and that `hwc_to_chw` produces `(3,H,W)` without changing bytes.
3. Record the exact mean/std arrays used by `preprocess_imagenet`; these are local convention values, not evidence about an unknown checkpoint.
4. Run `deprocess_imagenet(preprocess_imagenet(raw))` and require maximum byte error `0` for this fixture.
5. Record resize target and interpolation (`resize_nearest`); do not claim that nearest interpolation recovers lost detail.

Accepted evidence for this lesson is reproducible output from:

```bash
python3 main.py
```

Reject an array with a nonfinite value, a missing RGB axis, or a channel axis in the wrong position. A real file decoder or model card must supply any additional color-profile, crop, or batch policy.
