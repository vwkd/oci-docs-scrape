import { dirname, relative } from "@std/path";
import sanitizeFilename from "sanitize-filename";

/**
 * Get directory name of page
 *
 * - escape using hyphen
 * - remove leading and trailing dots, spaces and hyphens
 * - collapse whitespace and hyphens
 *
 * @param title page title
 * @returns directory name
 */
export function getDirectoryName(title: string): string {
  const name = sanitizeFilename(title.toLowerCase(), { replacement: "-" })
    .replace(/^[.\s-]+|[.\s-]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-");

  if (!name) {
    throw new Error(`Directory name is empty: ${title}`);
  }

  return name;
}

/**
 * Get relative link between two Markdown files
 *
 * @param from from filepath
 * @param to to filepath
 * @param fragment fragment
 * @returns relative link
 */
export function relativeLink(
  from: string,
  to: string,
  fragment = "",
): string {
  const link = relative(dirname(from), to);
  return `${link || "index.md"}${fragment}`;
}
