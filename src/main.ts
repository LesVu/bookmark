import { readFile, writeFile } from './utils/filesystem';
import { extractBookmark, generateBookmark, NHSorter, sortBookmark } from './utils/bookmark';

(async () => {
  writeFile(
    './static/generated.html',
    generateBookmark(
      await NHSorter(sortBookmark(extractBookmark(readFile('./static/bookmarks.html') as string)))
    )
  );
})();
