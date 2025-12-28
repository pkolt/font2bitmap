import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { picoFormat } from './pico.ts';
import type { Font } from '../types.ts';

describe('picoFormat', () => {
  test('should generate a C header for a simple fixed-width font', () => {
    const mockFont: Font = {
      name: 'test_font',
      width: 8,
      height: 8,
      spacing: 1,
      subsets: [
        {
          start: 65, // 'A'
          end: 66, // 'B'
          symbols: [
            { char: 'A', width: 8, bitmap: new Uint8Array([0x01, 0x02]) },
            { char: 'B', width: 8, bitmap: new Uint8Array([0x03, 0x04]) },
          ],
        },
      ],
    };

    const output = picoFormat(mockFont);

    assert.match(output, /#ifndef FONT_TEST_FONT_H/);
    assert.match(output, /#define FONT_TEST_FONT_H/);
    assert.match(output, /const font_t test_font = {/);
    assert.match(output, /\.width = 8/);
    assert.match(output, /\.height = 8/);
    assert.match(output, /\.spacing = 1/);
    assert.match(output, /\.subsets_count = 1/);
    assert.match(output, /\.start = 65/);
    assert.match(output, /\.end = 66/);
    assert.match(output, /\.symbols_count = 2/);
    assert.match(
      output,
      /symbols = \(uint8_t\[\]\)\{\s*\n\s*0x01, 0x02, \/\/ 'A',\s*\n\s*0x03, 0x04, \/\/ 'B'\s*\n\s*\}/s,
    );
    assert.match(output, /\.offsets = \(uint32_t\[\]\) \{ 0, 2 \}/);
    assert.match(output, /\.widths = NULL/);
    assert.match(output, /#endif \/\/ FONT_TEST_FONT_H/);
  });

  test('should generate a C header for a variable-width font', () => {
    const mockFont: Font = {
      name: 'variable_font',
      width: 9,
      height: 8,
      spacing: 1,
      subsets: [
        {
          start: 105, // 'i'
          end: 106, // 'j'
          symbols: [
            { char: 'i', width: 3, bitmap: new Uint8Array([0x01]) },
            { char: 'j', width: 9, bitmap: new Uint8Array([0x02, 0x03]) },
          ],
        },
      ],
    };

    const output = picoFormat(mockFont);

    assert.match(output, /const font_t variable_font = {/);
    assert.match(output, /\.width = 9/);
    assert.match(output, /symbols = \(uint8_t\[\]\)\{\s*\n\s*0x01, \/\/ 'i',\s*\n\s*0x02, 0x03, \/\/ 'j'\s*\n\s*\}/s);
    assert.match(output, /\.offsets = \(uint32_t\[\]\) \{\s*0,\s*1\s*\}/);
    assert.match(output, /\.widths = \(uint8_t\[\]\) /);
    assert.match(output, /\{\s*0x03,\s*0x09\s*\}/s);
    assert.doesNotMatch(output, /\.widths = NULL/);
  });

  test('should handle multiple subsets', () => {
    const mockFont: Font = {
      name: 'multi_subset_font',
      width: 8,
      height: 8,
      spacing: 0,
      subsets: [
        {
          start: 48, // '0'
          end: 49, // '1'
          symbols: [
            { char: '0', width: 8, bitmap: new Uint8Array([0x01]) },
            { char: '1', width: 8, bitmap: new Uint8Array([0x02]) },
          ],
        },
        {
          start: 97, // 'a'
          end: 98, // 'b'
          symbols: [
            { char: 'a', width: 8, bitmap: new Uint8Array([0x11]) },
            { char: 'b', width: 8, bitmap: new Uint8Array([0x12]) },
          ],
        },
      ],
    };

    const output = picoFormat(mockFont);

    assert.match(output, /\.subsets_count = 2/);

    // Check for both subsets' definitions
    assert.match(output, /\.start = 48/);
    assert.match(output, /\.end = 49/);
    assert.match(output, /\.start = 97/);
    assert.match(output, /\.end = 98/);

    // Quick check of symbol data for both
    assert.match(output, /0x01, \/\/ '0',\s*\n\s*0x02, \/\/ '1'/);
    assert.match(output, /0x11, \/\/ 'a',\s*\n\s*0x12, \/\/ 'b'/);
  });

  test('should handle an empty font with no subsets', () => {
    const mockFont: Font = {
      name: 'empty_font',
      width: 0,
      height: 0,
      spacing: 0,
      subsets: [],
    };

    const output = picoFormat(mockFont);

    assert.match(output, /#ifndef FONT_EMPTY_FONT_H/);
    assert.match(output, /const font_t empty_font = {/);
    assert.match(output, /\.width = 0/);
    assert.match(output, /\.height = 0/);
    assert.match(output, /\.subsets_count = 0/);
    // The subsets array should be empty
    assert.match(output, /\.subsets = \(const font_subset_t\[\]\) \{\n\n {4}\}/s);
  });
});
