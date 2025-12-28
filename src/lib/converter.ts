import { type CanvasRenderingContext2D, createCanvas, registerFont } from 'canvas';
import { type Font, type Subset } from './types.ts';
import { CYRILLIC_CHAR_SET, DIGITS_CHAR_SET, FONT_FAMILY, LATIN_CHAR_SET, PUNCTUATION_CHAR_SET } from './constants.ts';

export interface ConverterOptions {
  subsets: Subset[];
  symbols: string[];
  height: number;
  fontPath: string;
  fontName: string;
  letterSpacing: number;
  wordSpacing: number;
}

export function processSymbol(
  char: string,
  ctx: CanvasRenderingContext2D,
  height: number,
): { char: string; width: number; symbol: { char: string; width: number; bitmap: Uint8Array } } {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#000';
  ctx.fillText(char, 0, height / 2);

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, height);
  const { data } = imageData;

  let minX = ctx.canvas.width;
  let maxX = -1;

  // The symbol is drawn in black on a white background, so we look for pixels that are not white.
  // The symbol can be anti-aliased, so we check for pixel values less than 255.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < ctx.canvas.width; x++) {
      const r = data[(y * ctx.canvas.width + x) * 4];
      if (r !== undefined && r < 255) {
        if (x < minX) {
          minX = x;
        }
        if (x > maxX) {
          maxX = x;
        }
      }
    }
  }

  if (minX > maxX) {
    return {
      char,
      width: 0,
      symbol: {
        char,
        width: 0,
        bitmap: new Uint8Array(0),
      },
    };
  }

  const width = maxX - minX + 1;
  const bytesPerRow = Math.ceil(width / 8);
  const bitmap = new Uint8Array(bytesPerRow * height);

  // Create a 1-bit bitmap of the symbol.
  // Iterate over the cropped area of the symbol and if a pixel is darker than a middle-gray,
  // set the corresponding bit in the bitmap.
  if (width > 0) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelVal = data[(y * ctx.canvas.width + (minX + x)) * 4];
        if (pixelVal !== undefined && pixelVal < 128) {
          const byteIndex = y * bytesPerRow + Math.floor(x / 8);
          const bitIndex = x % 8;
          const byte = bitmap[byteIndex];
          if (byte !== undefined) {
            bitmap[byteIndex] = byte | (1 << bitIndex);
          }
        }
      }
    }
  }

  return {
    char: char,
    width,
    symbol: {
      char,
      width,
      bitmap,
    },
  };
}

export function groupSymbolsIntoSubsets(
  fontSymbols: { char: string; symbol: { char: string; width: number; bitmap: Uint8Array } }[],
): { start: number; end: number; symbols: { char: string; width: number; bitmap: Uint8Array }[] }[] {
  if (fontSymbols.length === 0) {
    return [];
  }

  const sortedSymbols = [...fontSymbols].sort((a, b) => a.char.charCodeAt(0) - b.char.charCodeAt(0));

  const firstSymbol = sortedSymbols[0];
  if (!firstSymbol) {
    return [];
  }

  const subsets = [];
  let currentSubset = {
    start: firstSymbol.char.charCodeAt(0),
    end: firstSymbol.char.charCodeAt(0),
    symbols: [firstSymbol.symbol],
  };

  for (let i = 1; i < sortedSymbols.length; i++) {
    const currentSymbol = sortedSymbols[i];
    if (!currentSymbol) {
      continue;
    }
    const charCode = currentSymbol.char.charCodeAt(0);
    if (charCode === currentSubset.end + 1) {
      currentSubset.end = charCode;
      currentSubset.symbols.push(currentSymbol.symbol);
    } else {
      subsets.push(currentSubset);
      currentSubset = {
        start: charCode,
        end: charCode,
        symbols: [currentSymbol.symbol],
      };
    }
  }
  subsets.push(currentSubset);

  return subsets;
}

export function converterFont(opts: ConverterOptions): Font {
  registerFont(opts.fontPath, { family: FONT_FAMILY });

  const { height } = opts;
  const mainCtx = createCanvas(height * 2, height).getContext('2d');
  mainCtx.font = `${height}px "${FONT_FAMILY}"`;
  mainCtx.textBaseline = 'middle';
  mainCtx.textAlign = 'left';
  mainCtx.textDrawingMode = 'glyph';

  const symbols = getSymbols(opts.subsets, opts.symbols);

  const font: Font = {
    name: opts.fontName,
    width: 0,
    height: 0,
    letterSpacing: opts.letterSpacing,
    wordSpacing: opts.wordSpacing,
    subsets: [],
  };

  if (symbols.length === 0) {
    return font;
  }

  const processedSymbols = symbols.map((char) => processSymbol(char, mainCtx, height));

  const fontSymbols = processedSymbols.map(({ char, symbol }) => ({ char, symbol }));
  const maxWidth = Math.max(0, ...processedSymbols.map((s) => s.width));

  font.width = maxWidth;
  font.height = height;
  font.subsets = groupSymbolsIntoSubsets(fontSymbols);

  return font;
}

function getSymbols(subsets: Subset[], customSymbols: string[]): string[] {
  const charSets: Record<Subset, string> = {
    ascii: Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join(''),
    latin: LATIN_CHAR_SET,
    digits: DIGITS_CHAR_SET,
    cyrillic: CYRILLIC_CHAR_SET,
    punctuation: PUNCTUATION_CHAR_SET,
  };
  const allChars = new Set(customSymbols);
  subsets.forEach((subset) => {
    charSets[subset].split('').forEach((char) => allChars.add(char));
  });
  return Array.from(allChars);
}
