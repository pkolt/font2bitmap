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

# Create font with custom letter and word spacing
font2bitmap \
  --fontPath ./fonts/GoogleSansCode-Medium.ttf \
  --fontName google_sans_code \
  --height 10 \
  --output ./google_sans_code_spaced.h \
  --letter-spacing 2 \
  --word-spacing 4 \
  --subsets ascii

# Help
font2bitmap --help
```

## Formatting

The tool generates a C header file (e.g., `my_font.h`) that defines a `font_t` structure named after the `--fontName` option. This structure includes font properties such as width, height, letter spacing, word spacing, and character subsets. Subsets contain information about each character, including its bitmap representation.

Here's a brief example of what the generated C header file content looks like:

```c
#ifndef FONT_MY_FONT_H
#define FONT_MY_FONT_H

#include <stdint.h>
#include "font.h"

const font_t my_font = {
    .width = 6,
    .height = 10,
    .letter_spacing = 1,
    .word_spacing = 6,
    .subsets_count = 1,
    .subsets = (const font_subset_t[]) {
        {
            .start = 32,
            .end = 126,
            .symbols_count = 95,
            .symbols = (uint8_t[]){
                // Bitmap data for characters
                // ...
            },
            .offsets = (uint32_t[]) { /* ... */ },
            .widths = NULL
        }
    }
};

#endif // FONT_MY_FONT_H
```

## Limitations

- The font bitmap is saved with LSB-first bit order.
- Variable fonts are not supported.

## License

[MIT](./LICENSE.md)