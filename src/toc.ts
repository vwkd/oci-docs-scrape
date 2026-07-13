import { join } from "@std/path";
import { getDirectoryName } from "./paths.ts";
import { getPageUrl } from "./urls.ts";
import type { Page, Toc, TocNode } from "./types.ts";

const TOC_URL = "https://docs.oracle.com/en-us/iaas/toc.json";

/**
 * Fetch TOC from API
 *
 * @returns TOC
 */
export async function fetchToc(): Promise<Toc> {
  const res = await fetch(TOC_URL);

  if (!res.ok) {
    throw new Error(`${TOC_URL}: ${res.status} ${res.statusText}`);
  }

  return await res.json() as Toc;
}

/**
 * Parse TOC
 *
 * @param toc TOC
 * @returns flat list of pages
 */
export function parseToc(toc: Toc): Page[] {
  const pages: Page[] = [];

  /**
   * Assemble pages
   *
   * - visit tree nodes in display order carrying directory path segments forward
   * - assemble page with directory path from TOC hierarchy and title
   *
   * @param tree tree
   * @param parentDirectoryPathSegments parent directory path segments
   */
  function visit(tree: TocNode[], parentDirectoryPathSegments: string[]): void {
    for (const node of tree) {
      const page = toc.pages[node.i];

      if (!page) {
        throw new Error(`Tree node references missing page: ${node.i}`);
      }

      const directoryPathSegments = [
        ...parentDirectoryPathSegments,
        getDirectoryName(page.t),
      ];

      pages.push({
        title: page.t,
        url: getPageUrl(
          node.i,
          page,
          toc.sourceBasepaths,
        ),
        directoryPath: join("", ...directoryPathSegments),
      });

      if (node.c) {
        visit(node.c, directoryPathSegments);
      }
    }
  }

  visit(toc.tree, []);

  return pages;
}
