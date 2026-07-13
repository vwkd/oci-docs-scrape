# README

Scrape Oracle Cloud Infrastructure Documentation



## Features

- markdown `index.md` files
- TOC folder hierarchy
- incremental, non-destructive, resumable



## Usage

- scrape all

```sh
deno task run scrape -o ./docs
```

- scrape subtree
- beware: root page URL must have no locale prefix, query or fragment

```sh
deno task run scrape \
  -r https://docs.oracle.com/iaas/Content/Compute/home.htm \
  -o ./docs/compute
```
