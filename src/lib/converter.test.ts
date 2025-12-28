import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, registerFont, type CanvasRenderingContext2D } from 'canvas';
import { groupSymbolsIntoSubsets, converterFont, type ConverterOptions, processSymbol } from './converter.ts';
import { FONT_FAMILY } from './constants.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');
const fontPath = path.join(projectRoot, 'fonts', 'GoogleSansCode-Medium.ttf');
const fontName = 'RobotoMono';

const defaultOptions: ConverterOptions = {
  fontName,
  fontPath,
  height: 16,
  subsets: [],
  symbols: [],
  letterSpacing: 0,
  wordSpacing: 0,
};

describe('converterFont', () => {
  it('should convert a single character without errors', () => {
    const options: ConverterOptions = {
      ...defaultOptions,
      symbols: ['A'],
    };

    const font = converterFont(options);

    assert.ok(font, 'The font object should be created');
    assert.strictEqual(font.subsets.length, 1, 'Should have one subset for "A"');

    const subset = font.subsets[0];
    assert.ok(subset, 'Subset should exist');
    assert.strictEqual(subset.start, 'A'.charCodeAt(0), 'Subset should start at "A"');
    assert.strictEqual(subset.end, 'A'.charCodeAt(0), 'Subset should end at "A"');

    assert.strictEqual(subset.symbols.length, 1, 'Should have one symbol in the subset');
    const symbol = subset.symbols[0];
    assert.ok(symbol, 'Symbol for "A" should exist');

    assert.ok(symbol.width > 0, 'Symbol width should be greater than 0');

    assert.ok(symbol.bitmap.length > 0, 'Symbol bitmap should not be empty');

    const expectedBitmapSize = Math.ceil(symbol.width / 8) * font.height;
    assert.strictEqual(symbol.bitmap.length, expectedBitmapSize, 'Bitmap size should be correct');
  });

  it('should handle multiple character subsets', () => {
    const options: ConverterOptions = {
      ...defaultOptions,
      height: 12,
      subsets: ['digits'],
    };

    const font = converterFont(options);

    assert.ok(font, 'The font object should be created');
    assert.strictEqual(font.subsets.length, 1, 'Should have one contiguous subset for digits');

    const subset = font.subsets[0];
    assert.ok(subset);
    assert.strictEqual(subset.start, '0'.charCodeAt(0));
    assert.strictEqual(subset.end, '9'.charCodeAt(0));
    assert.strictEqual(subset.symbols.length, 10);
  });

  it('should handle empty input', () => {
    const font = converterFont(defaultOptions);

    assert.ok(font, 'The font object should be created even for empty input');
    assert.strictEqual(font.subsets.length, 0, 'Should have no subsets for empty input');
  });
});

describe('groupSymbolsIntoSubsets', () => {
  const createDummySymbol = (char: string) => ({
    char,
    symbol: { char, width: 1, bitmap: new Uint8Array([1]) },
  });

  it('should return an empty array for empty input', () => {
    const subsets = groupSymbolsIntoSubsets([]);
    assert.deepStrictEqual(subsets, []);
  });

  it('should group a single symbol into one subset', () => {
    const symbols = [createDummySymbol('A')];
    const subsets = groupSymbolsIntoSubsets(symbols);
    assert.strictEqual(subsets.length, 1);
    assert.strictEqual(subsets[0]?.start, 'A'.charCodeAt(0));
    assert.strictEqual(subsets[0]?.end, 'A'.charCodeAt(0));
    assert.strictEqual(subsets[0]?.symbols.length, 1);
  });

  it('should group contiguous symbols into a single subset', () => {
    const symbols = [createDummySymbol('A'), createDummySymbol('B'), createDummySymbol('C')];
    const subsets = groupSymbolsIntoSubsets(symbols);
    assert.strictEqual(subsets.length, 1);
    assert.strictEqual(subsets[0]?.start, 'A'.charCodeAt(0));
    assert.strictEqual(subsets[0]?.end, 'C'.charCodeAt(0));
    assert.strictEqual(subsets[0]?.symbols.length, 3);
  });

  it('should group non-contiguous symbols into multiple subsets', () => {
    const symbols = [createDummySymbol('A'), createDummySymbol('C'), createDummySymbol('D')];
    const subsets = groupSymbolsIntoSubsets(symbols);
    assert.strictEqual(subsets.length, 2);

    assert.strictEqual(subsets[0]?.start, 'A'.charCodeAt(0));
    assert.strictEqual(subsets[0]?.end, 'A'.charCodeAt(0));
    assert.strictEqual(subsets[0]?.symbols.length, 1);

    assert.strictEqual(subsets[1]?.start, 'C'.charCodeAt(0));
    assert.strictEqual(subsets[1]?.end, 'D'.charCodeAt(0));
    assert.strictEqual(subsets[1]?.symbols.length, 2);
  });

  it('should handle symbols that are not in order', () => {
    const symbols = [createDummySymbol('C'), createDummySymbol('A'), createDummySymbol('B')];
    const subsets = groupSymbolsIntoSubsets(symbols);
    assert.strictEqual(subsets.length, 1);
    assert.strictEqual(subsets[0]?.start, 'A'.charCodeAt(0));
    assert.strictEqual(subsets[0]?.end, 'C'.charCodeAt(0));
    assert.strictEqual(subsets[0]?.symbols.length, 3);
  });
});

describe('processSymbol', () => {
  let ctx: CanvasRenderingContext2D;
  const height = 16;

  before(() => {
    registerFont(fontPath, { family: FONT_FAMILY });
    const canvas = createCanvas(height * 2, height);
    ctx = canvas.getContext('2d');
    ctx.font = `${height}px "${FONT_FAMILY}"`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.textDrawingMode = 'glyph';
  });

  it('should process a character and return symbol data', () => {
    const result = processSymbol('A', ctx, height);

    assert.strictEqual(result.char, 'A');
    assert.ok(result.width > 0, 'Width should be greater than 0');
    assert.ok(result.symbol.bitmap.length > 0, 'Bitmap should not be empty');
    assert.strictEqual(result.symbol.char, 'A');
    assert.strictEqual(result.symbol.width, result.width);
  });

  it('should process a whitespace character', () => {
    const result = processSymbol(' ', ctx, height);

    assert.strictEqual(result.char, ' ');
    assert.strictEqual(result.width, 0, 'Width should be 0 for whitespace');
    assert.strictEqual(result.symbol.bitmap.length, 0, 'Bitmap should be empty for whitespace');
  });
});
