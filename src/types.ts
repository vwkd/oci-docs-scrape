/** Table of contents */
export interface Toc {
  /** Root tree, in display order */
  tree: TocNode[];
  /** Pages by identifier */
  pages: Record<string, TocPage>;
  /** Source base paths by identifier */
  sourceBasepaths: Record<string, string>;
  sourceFilter: Record<string, "true">;
}

/** Tree node */
export interface TocNode {
  /** Page identifier */
  i: string;
  n?: string;
  /** Subtree, in display order */
  c?: TocNode[];
}

/** Page metadata */
export interface TocPage {
  /** Path, relative to its source base path */
  p: string;
  /** Display title */
  t: string;
  /** Source base path identifier */
  s: number;
}

/** Page */
export interface Page {
  title: string;
  url: URL;
  directoryPath: string;
}

/** Scrape options */
export interface ScrapeOptions {
  out: string;
  root?: string;
}
