import { readFile, writeFile } from './utils/filesystem';
import { extractBookmark, generateBookmark, NHSorter, sortBookmark } from './utils/bookmark';
// import { Bookmark_Item } from './types/bookmark_types';

const sortNH = true;

(async () => {
  if (sortNH) {
    writeFile(
      './static/generated.html',
      generateBookmark(
        await NHSorter(sortBookmark(extractBookmark(readFile('./static/bookmarks.html') as string)))
      )
    );
  } else {
    writeFile(
      './static/generated.html',
      generateBookmark(sortBookmark(extractBookmark(readFile('./static/bookmarks.html') as string)))
    );
  }

  // interface Test {
  //   website: string;
  //   children: Bookmark_Item[];
  // }

  // let codes: string[] = [];
  // sortBookmark(extractBookmark(readFile('./static/generated.html') as string)).forEach(i => {
  //   if (i.website == 'nhentai') {
  //     i.children.forEach(j => {
  //       (j as unknown as Test).children.forEach(k => {
  //         if (k.href) {
  //           let match = k.href.match(/\/(\d{4,})(?=\/|$)/);
  //           if (match) {
  //             codes.push(match[1] as string);
  //           }
  //         }
  //       });
  //     });
  //   }
  // });
  // console.log(codes.length);
  // let codes1: string[] = [];
  // sortBookmark(extractBookmark(readFile('./static/generated.html') as string)).forEach(i => {
  //   if (i.website == 'nhentai') {
  //     i.children.forEach(j => {
  //       (j as unknown as Test).children.forEach(k => {
  //         if (k.href) {
  //           let match = k.href.match(/\/(\d{4,})(?=\/|$)/);
  //           if (match) {
  //             codes1.push(match[1] as string);
  //           }
  //         }
  //       });
  //     });
  //   }
  // });
  // console.log(codes1.length);

  // // @ts-ignore
  // let coun = codes1.filter(function (x) {
  //   // return elements in previousArray matching...
  //   return !codes.includes(x); // "this element doesn't exist in currentArray"
  // });
  // console.log(coun.length);
})();
