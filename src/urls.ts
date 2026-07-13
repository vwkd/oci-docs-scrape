import { join } from "@std/path";
import type { TocPage } from "./types.ts";

const DOCS_BASE_URL = "https://docs.oracle.com";

/**
 * Get page URL
 *
 * @param pageId page ID
 * @param page page
 * @param sourceBasepaths source base paths
 * @returns page URL
 */
export function getPageUrl(
  pageId: string,
  page: TocPage,
  sourceBasepaths: Record<string, string>,
): URL {
  const path = page.p;
  const sourceBasePath = sourceBasepaths[String(page.s)];

  if (!sourceBasePath) {
    throw new Error(`Page ${pageId} has no source base path`);
  }

  // other page
  if (/^https?:\/\//i.test(path)) {
    return new URL(path);
  }

  // docs category page
  if (path.startsWith("/")) {
    return new URL(path, DOCS_BASE_URL);
  }

  // docs leaf page
  const url = new URL(join(sourceBasePath, path), DOCS_BASE_URL);

  return url;
}

/**
 * Check if docs page
 *
 * @param url page URL
 * @returns true if docs page, false otherwise
 */
export function isDocsPage(url: URL): boolean {
  return url.origin == DOCS_BASE_URL && !url.hash.startsWith("#/");
}

/**
 * Remove fragment from URL
 *
 * @param url url
 * @returns url without fragment
 */
export function urlWithoutFragment(url: URL): string {
  const urlNew = new URL(url);
  urlNew.hash = "";
  return urlNew.href;
}
