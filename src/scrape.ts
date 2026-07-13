import { exists } from "@std/fs";
import { join } from "@std/path";
import { fetchPage, parsePage } from "./page.ts";
import { fetchToc, parseToc } from "./toc.ts";
import { isDocsPage, urlWithoutFragment } from "./urls.ts";
import type { ScrapeOptions } from "./types.ts";

/**
 * Scrape OCI documentation to Markdown
 *
 * @param options scrape options
 */
export async function scrape(options: ScrapeOptions): Promise<void> {
  const outputDirectory = options.out;

  const toc = await fetchToc();
  const rootUrl = options.root ? new URL(options.root) : undefined;
  const pages = parseToc(toc, rootUrl);

  if (rootUrl) {
    console.log(`Selected ${pages[0].title}`);
  }

  const urlFilepathMap = new Map(
    pages
      .filter((page) => isDocsPage(page.url))
      .map((page) =>
        [
          urlWithoutFragment(page.url),
          join(outputDirectory, page.directoryPath, "index.md"),
        ] as const
      ),
  );

  let written = 0;

  for (const [index, page] of pages.entries()) {
    const progress = `[${index + 1}/${pages.length}]`;

    if (!isDocsPage(page.url)) {
      console.log(`${progress} skip unsupported ${page.url.href}`);
      continue;
    }

    const directoryPath = join(outputDirectory, page.directoryPath);
    const filepath = join(directoryPath, "index.md");

    if (await exists(filepath)) {
      console.log(`${progress} skip existing ${filepath}`);
      continue;
    }

    const html = await fetchPage(page.url);
    const markdown = parsePage(html, page, filepath, urlFilepathMap);

    await Deno.mkdir(directoryPath, { recursive: true });
    await Deno.writeTextFile(filepath, markdown, { createNew: true });

    written += 1;

    console.log(`${progress} wrote ${filepath}`);
  }

  console.log(`Done. Wrote ${written} new page${written == 1 ? "" : "s"}.`);
}
