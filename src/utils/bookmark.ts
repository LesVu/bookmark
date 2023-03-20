import { load } from 'cheerio';
import { Bookmark_Item } from '../types/bookmark_types';
import { sortByKey, readConfig } from './misc';

export function extractBookmark(data: string) {
  const $ = load(data);
  let anchor_tag = $('DL DT A');
  // let h3tag = $('H3');
  // console.log(atag.get(0).attribs.href);
  // console.log(atag.get(0).children[0].data);
  // console.log(atag.get(0).parent.parent.parent.children[0].children[0].data);
  let count = 0;
  let array_sorted: Bookmark_Item[] = [];
  anchor_tag.get().forEach(async i => {
    count++;
    if (i.attribs['href'] && i.children[0]) {
      array_sorted.push({
        href: i.attribs['href'],
        name: (i.children[0] as unknown as Text).data,
      });
    }
  });

  /* This code dk why i write */
  // let tmp3 = [];
  // let tmp4 = [];
  // h3tag.get().forEach(i => {
  //   let tmp = [
  //     { folder: (i.children[0] as unknown as Text).data, children: [] },
  //   ];
  //   // tmp4 = [];
  //   tmp.forEach(iarray => {
  //     let tmp2 = [];
  //     if ((i.children[0] as unknown as Text).data == iarray.folder) {
  //       anchor_tag.get().forEach(i2 => {
  //         if (
  //           (i.children[0] as unknown as Text).data ==
  //           (i2.parent.parent.parent.children[0].children[0] as unknown as Text)
  //             .data
  //         ) {
  //           tmp2.push({ href: i2.attribs.href, name: i2.children[0].data });
  //         } else if (
  //           i2.parent.parent.parent.children[0].children[0].data == 'Bookmarks'
  //         ) {
  //           tmp4.push({ href: i2.attribs.href, name: i2.children[0].data });
  //         }
  //       });
  //     }
  //     tmp3.push({ folder: i.children[0].data, children: [...tmp2] });
  //   });
  // });

  // tmp3[0].children = [...tmp4];

  array_sorted = sortByKey(array_sorted, 'href');
  array_sorted = sortByKey(array_sorted, 'name');

  console.log('Total Bookmarks:', count);
  return array_sorted;
}

export function sortBookmark(data: Bookmark_Item[]) {
  let config = readConfig();

  let website: string[] = [];
  // Extract website name
  data.forEach(i => {
    const web = i.href
      .replace(/^https?:\/\//, '')
      .replace(/^www\d?\./, '')
      .replace(/\..*$/, '');
    if (!website.includes(web)) website.push(web);
  });

  let sorted = [];
  let sorted1 = [];

  website.forEach(i => {
    let result: Bookmark_Item[] = [];
    let websort = { website: i, children: [] };

    // Find and list website
    data.forEach(i2 => {
      if (
        i ==
        i2.href
          .replace(/^https?:\/\//, '')
          .replace(/^www\d?\./, '')
          .replace(/\..*$/, '')
      ) {
        result.push(i2);
      }
    });

    if (result.length >= Number(config.website!.folder_exclude_size)) {
      if (config.exclude.website.find(elmt => elmt == i)) {
        console.log(i);
        sorted1.push(...result);
      } else {
        const chunkSize = Number(config.website.folder_size);
        if (result.length >= chunkSize && chunkSize > 0) {
          for (let i2 = 0; i2 < result.length; i2 += chunkSize) {
            const chunk = result.slice(i2, i2 + chunkSize);
            // let result2 = [];
            // result2.push({ website: i + i2 / 10, children: [...chunk] });
            // sorted.push({ website: i, children: [...result2] });
            websort.children.push({
              website: i + i2 / chunkSize,
              children: [...chunk],
            });
          }
          sorted.push(websort);
        } else {
          sorted.push({ website: i, children: [...result] });
        }
      }
    } else {
      sorted1.push(...result);
    }
  });

  sorted.push({ website: 'none', children: sorted1 });
}
