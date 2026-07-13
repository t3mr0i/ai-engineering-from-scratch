# Third-Party Notices

This project (MIT-licensed — see [LICENSE](LICENSE)) redistributes the following
third-party components. Their copyright notices and license terms are reproduced
below as required.

## Vendored in `public/assets/`

### gpt-tokenizer (`gpt-tokenizer.cl100k.js`)
- Source: https://github.com/niieani/gpt-tokenizer
- License: MIT
- Copyright (c) 2023-2024 Bazyli Brzoska

### qrcodejs (`qrcode.min.js`)
- Source: https://github.com/davidshimjs/qrcodejs
- License: MIT
- Copyright (c) 2012 davidshimjs

Both components are distributed under the MIT License:

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Loaded at runtime (not redistributed in this repository)

These are fetched by the user's browser from a CDN only after explicit opt-in in
the on-device chapter; they are not bundled here, but are listed for transparency:

- **@huggingface/transformers** (transformers.js) — Apache-2.0 — loaded via
  `import()` from esm.sh.
- **LiquidAI/LFM2.5-350M-ONNX** (on-device model) — governed by Liquid AI's own
  model license (the "LFM Open License", not an OSI-approved open-source license).
  Review its terms before any commercial redistribution:
  https://huggingface.co/LiquidAI/LFM2.5-350M
