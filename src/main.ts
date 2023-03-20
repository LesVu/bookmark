import { readFile, writeFile } from './utils/filesystem';
import { extractBookmark, generateBookmark, sortBookmark } from './utils/bookmark';

writeFile(
  './static/generated.html',
  generateBookmark(sortBookmark(extractBookmark(readFile('./static/bookmarks.html') as string)))
);
