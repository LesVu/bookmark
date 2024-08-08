import { readFile, writeFile } from './utils/filesystem';
import { extractBookmark, generateBookmark, NHSorter, sortBookmark } from './utils/bookmark';

const sortNH = false;

(async () => {
  if (sortNH) {
    writeFile(
      './static/generated.html',
      generateBookmark(await NHSorter(sortBookmark(extractBookmark(readFile('./static/bookmarks.html') as string)))),
    );
  } else {
    writeFile(
      './static/generated.html',
      generateBookmark(sortBookmark(extractBookmark(readFile('./static/bookmarks.html') as string))),
    );
  }
})();
