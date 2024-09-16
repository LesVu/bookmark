import { readFile, writeFile } from './utils/filesystem.ts';
import { extractBookmarks, generateBookmark, NHSorter, sortBookmarks } from './utils/bookmark.ts';
import { parseArgs } from 'jsr:@std/cli/parse-args';
import { exit } from 'node:process';

if (parseArgs(Deno.args).help) {
  console.log(`Usage: --sortNH`);
  exit(0);
}

const sortNH = parseArgs(Deno.args).sortNH ?? false;
const html = readFile('./static/bookmarks.html') as string;
const bookmark = extractBookmarks(html);
let bookmarks = sortBookmarks(bookmark);
if (sortNH) {
  bookmarks = await NHSorter(bookmarks);
}
const bookmarksHTML = generateBookmark(bookmarks);
writeFile('./static/generated.html', bookmarksHTML);
