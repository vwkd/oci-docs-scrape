import { Command } from "commander";
import { scrape } from "./scrape.ts";

const program = new Command();

program
  .name("oci-docs-scrape")
  .description("Scrape Oracle Cloud Infrastructure Documentation")
  .version("0.0.1");

program
  .command("scrape")
  .description("scrape to markdown")
  .requiredOption("-o, --out <directory>", "output directory")
  .option("-r, --root <url>", "root page URL")
  .action(scrape);

await program.parseAsync(Deno.args, { from: "user" });
