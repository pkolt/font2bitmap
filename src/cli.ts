#!/usr/bin/env node

import fs from 'node:fs';
import { Command } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import { converterFont, type ConverterOptions } from './lib/converter.ts';
import { picoFormat } from './lib/formatters/pico.ts';
import type { Subset } from './lib/types.ts';

const program = new Command();

program.name('font2bitmap').version(pkg.version).description(pkg.description);

program
  .requiredOption('--fontPath <path>', 'Path to the font file (e.g., RobotoMono-Medium.ttf)')
  .requiredOption('--fontName <name>', 'Name of the font (e.g., RobotoMono)')
  .requiredOption('--height <height>', 'Height of the font in pixels', (value) => parseInt(value, 10))
  .requiredOption('--output <path>', 'Output file path')
  .option('--format <format>', 'Output format', 'pico')
  .option('--subsets <subset1,subset2>', 'Comma-separated list of character subsets', (value) => value.split(','), [
    'ascii',
  ])
  .option('--spacing <spacing>', 'Letter spacing', (value) => parseInt(value, 10), 1)
  .option('--symbols <value>', 'A string of additional characters to include', '');

program.parse(process.argv);

const options = program.opts();

try {
  if (!fs.existsSync(options.fontPath)) {
    throw new Error(`Error: Font file not found at ${options.fontPath}`);
  }

  const converterOptions: ConverterOptions = {
    fontPath: options.fontPath,
    fontName: options.fontName,
    height: options.height,
    subsets: options.subsets as Subset[],
    symbols: options.symbols ? Array.from(options.symbols) : [],
    spacing: options.spacing,
  };

  const font = converterFont(converterOptions);

  if (options.format === 'pico') {
    const picoOutput = picoFormat(font);
    fs.writeFileSync(options.output, picoOutput);
    console.log(`Output successfully written to ${options.output}`);
  } else {
    throw new Error(`Error: Unsupported format "${options.format}"`);
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
}
