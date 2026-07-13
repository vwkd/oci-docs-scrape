import { load } from "cheerio";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { stringify } from "@std/yaml";
import { relativeLink } from "./paths.ts";
import { urlWithoutFragment } from "./urls.ts";
import type { Page } from "./types.ts";

const ARTICLE_SELECTOR = "#dcoc-content-body .vl-content > article";

const turndown = new TurndownService({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  headingStyle: "atx",
  hr: "---",
});

turndown.use(gfm);

turndown.addRule("topicHeading", {
  filter: (node) =>
    /^H[1-6]$/.test(node.nodeName) &&
    node.parentElement?.nodeName === "ARTICLE" &&
    node.parentElement.hasAttribute("id"),
  replacement: (content, node) => {
    const level = Number(node.nodeName.slice(1));
    const id = node.parentElement!.getAttribute("id")!;

    return `\n\n${"#".repeat(level)} ${content.trim()} {#${id}}\n\n`;
  },
});

/**
 * Fetch page
 *
 * @param url URL of page
 * @returns HTML of page
 */
export async function fetchPage(url: URL): Promise<string> {
  const res = await fetch(url.href);

  if (!res.ok) {
    throw new Error(`${url.href}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  return html;
}

/**
 * Parse page to Markdown
 *
 * - select article
 * - rewrite relative links
 * - convert to Markdown
 *
 * @param html HTML of page
 * @param page page
 * @param filepath filepath
 * @param urlFilepathMap map of URLs to filepaths
 */
export function parsePage(
  html: string,
  page: Page,
  filepath: string,
  urlFilepathMap: ReadonlyMap<string, string>,
): string {
  const $ = load(html);
  const article = $(ARTICLE_SELECTOR).first();

  if (article.length == 0) {
    throw new Error(`${page.url.href}: article not found`);
  }

  article.find("a[href]").each((_, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    const targetUrl = new URL(href, page.url);
    const targetFilepath = urlFilepathMap.get(urlWithoutFragment(targetUrl));

    $(element).attr(
      "href",
      targetFilepath
        ? relativeLink(filepath, targetFilepath, targetUrl.hash)
        : targetUrl.href,
    );
  });

  article.find("img[src], source[src], video[src], audio[src]").each(
    (_, element) => {
      const src = $(element).attr("src");
      if (src) {
        $(element).attr("src", new URL(src, page.url).href);
      }
    },
  );

  const content = turndown.turndown(article.html() ?? "").trim();

  const markdown = `---
title: ${stringify(page.title).trimEnd()}
url: ${stringify(page.url.href).trimEnd()}
---

${content}
`;

  return markdown;
}
