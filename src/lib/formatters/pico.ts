import type { Font } from '../types.ts';

export function picoFormat(font: Font): string {
  const name = font.name;
  const headerGuard = `FONT_${name.toUpperCase()}_H`;

  const subsetsC = font.subsets
    .map((subset) => {
      let runningOffset = 0;
      const offsets: number[] = [];
      const widths: number[] = [];
      const symbolBitmapStrings: string[] = [];

      const formatBitmapWithComment = (
        bitmap: Uint8Array,
        char: string,
        bytesPerLine: number = 16,
        indent: number = 16,
      ) => {
        if (bitmap.length === 0) {
          return '';
        }
        const hex = Array.from(bitmap).map((b) => `0x${b.toString(16).padStart(2, '0')}`);
        const lines = [];
        for (let i = 0; i < hex.length; i += bytesPerLine) {
          lines.push(' '.repeat(indent) + hex.slice(i, i + bytesPerLine).join(', '));
        }
        const lastLine = lines.pop();
        if (lastLine) {
          lines.push(`${lastLine},`);
        }
        return `${lines.join(',\n')} // '${char}'`;
      };

      const isVariableWidth = subset.symbols.some((s) => s.width !== font.width);

      for (const symbol of subset.symbols) {
        offsets.push(runningOffset);
        runningOffset += symbol.bitmap.length;
        widths.push(symbol.width);
        symbolBitmapStrings.push(formatBitmapWithComment(symbol.bitmap, symbol.char, 16, 16));
      }

      const formatHexArray = (bytes: number[], bytesPerLine: number = 16, indent: number = 16) => {
        if (bytes.length === 0) {
          return '{}';
        }
        const hex = bytes.map((b) => `0x${b.toString(16).padStart(2, '0')}`);
        const lines = [];
        for (let i = 0; i < hex.length; i += bytesPerLine) {
          lines.push(' '.repeat(indent) + hex.slice(i, i + bytesPerLine).join(', '));
        }
        return `{
${lines.join(',\n')}
            }`;
      };

      const symbolsData = `{
${symbolBitmapStrings.filter((s) => s !== '').join(',\n')}
            }`;

      const offsetsData = `{ ${offsets.join(', ')} }`;

      const widthsArrayC = isVariableWidth ? `(uint8_t[]) ${formatHexArray(widths, 20, 16)}` : 'NULL';

      return `        {
            .start = ${subset.start},
            .end = ${subset.end},
            .symbols_count = ${subset.symbols.length},
            .symbols = (uint8_t[])${symbolsData},
            .offsets = (uint32_t[]) ${offsetsData},
            .widths = ${widthsArrayC}
        }`;
    })
    .join(',\n');

  const result = `#ifndef ${headerGuard}
#define ${headerGuard}

#include <stdint.h>
#include "font.h"

const font_t ${name} = {
    .width = ${font.width},
    .height = ${font.height},
    .letter_spacing = ${font.letterSpacing},
    .word_spacing = ${font.wordSpacing},
    .subsets_count = ${font.subsets.length},
    .subsets = (const font_subset_t[]) {
${subsetsC}
    }
};

#endif // ${headerGuard}
`;

  return result;
}
