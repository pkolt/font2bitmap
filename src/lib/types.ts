import { SUBSETS } from './constants.ts';

export type Subset = (typeof SUBSETS)[number];

export interface FontSymbol {
  char: string;
  width: number;
  bitmap: Uint8Array;
}

export interface FontSubset {
  start: number;
  end: number;
  symbols: FontSymbol[];
}

export interface Font {
  name: string;
  width: number;
  height: number;
  letterSpacing: number;
  subsets: FontSubset[];
}
