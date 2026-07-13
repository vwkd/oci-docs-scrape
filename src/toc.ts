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
 * @param rootUrl URL of subtree root
 * @returns flat list of pages
 */
export function parseToc(toc: Toc, rootUrl?: URL): Page[] {
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

  const tree = rootUrl ? [findRootNode(toc, rootUrl)] : toc.tree;

  visit(tree, []);

  return pages;
}

/**
 * Find subtree root
 *
 * - use single matching node with children
 * - error if multiple matching nodes have children
 * - otherwise use first matching leaf
 *
 * @param toc TOC
 * @param rootUrl URL of subtree root
 * @returns subtree root
 */
function findRootNode(toc: Toc, rootUrl: URL): TocNode {
  const subtrees: TocNode[] = [];

  /**
   * Find subtrees
   *
   * - visit tree nodes in display order
   * - store subtrees with matching URL
   *
   * @param tree tree
   */
  function visit(tree: TocNode[]): void {
    for (const node of tree) {
      const page = toc.pages[node.i];

      if (!page) {
        throw new Error(`Tree node references missing page: ${node.i}`);
      }

      const pageUrl = getPageUrl(node.i, page, toc.sourceBasepaths);

      if (pageUrl.href == rootUrl.href) {
        subtrees.push(node);
      }

      if (node.c) {
        visit(node.c);
      }
    }
  }

  visit(toc.tree);

  if (subtrees.length == 0) {
    throw new Error(`TOC page not found: ${rootUrl.href}`);
  }

  if (subtrees.length == 1) {
    return subtrees[0];
  }

  const branches = subtrees.filter((node) => node.c?.length);

  if (branches.length == 1) {
    return branches[0];
  }

  if (branches.length > 1) {
    const titles = branches.map((node) => toc.pages[node.i].t).join(", ");

    throw new Error(
      `Multiple TOC subtrees found for ${rootUrl.href}: ${titles}`,
    );
  }

  return subtrees[0];
}
