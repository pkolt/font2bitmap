# Font2Bitmap

Converts fonts to bitmaps for use in OLED displays.

## Install

1. Install [Node.js 24](https://nodejs.org/en/download)
2. Install [dependencies](https://github.com/Automattic/node-canvas?tab=readme-ov-file#compiling) for `node-canvas`
3. Install font2bitmap `npm install font2bitmap -g`

## Usage

```bash
# Create ASCII font
font2bitmap \
  --fontPath ./fonts/GoogleSansCode-Medium.ttf \
  --fontName google_sans_code \
  --height 10 \
  --output ./google_sans_code_ascii.h \
  --subsets ascii \
  --symbols '°$%'

# Create ASCII+Cyrillic font
font2bitmap \
  --fontPath ./fonts/GoogleSansCode-Medium.ttf \
  --fontName google_sans_code \
  --height 10 \
  --output ./google_sans_code_cyrillic.h \
  --subsets ascii,cyrillic

# Create only digits font
font2bitmap \
  --fontPath ./fonts/GoogleSansCode-Medium.ttf \
  --fontName google_sans_code \
  --height 10 \
  --output ./google_sans_code_digits.h \
  --subsets digits

# Create only symbols font
font2bitmap \
  --fontPath ./fonts/GoogleSansCode-Medium.ttf \
  --fontName google_sans_code \
  --height 10 \
  --output ./google_sans_code_symbols.h \
  --symbols '°$%'

# Help
font2bitmap --help
```

## Limitations

- The font bitmap is saved with LSB-first bit order.
- Variable fonts are not supported.

## License

[MIT](./LICENSE.md)