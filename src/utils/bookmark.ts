import { load } from 'cheerio';
import { Bookmark_Item } from '../types/bookmark_types';
export function extractBookmark(data: string) {
  const $ = load(data);
  let anchor_tag = $('DL DT A');
  let h3tag = $('H3');
  // console.log(atag.get(0).attribs.href);
  // console.log(atag.get(0).children[0].data);
  // console.log(atag.get(0).parent.parent.parent.children[0].children[0].data);
  let count = 0;
  let arrayjson1: Bookmark_Item[] = [];
  anchor_tag.get().forEach(async i => {
    count++;
    if (i.attribs['href'] && i.children[0]) {
      arrayjson1.push({
        href: i.attribs['href'],
        name: (i.children[0] as unknown as Text).data,
      });
    }
  });

  let tmp3 = [];
  let tmp4 = [];
  h3tag.get().forEach(i => {
    let tmp = [
      { folder: (i.children[0] as unknown as Text).data, children: [] },
    ];
    tmp4 = [];
    tmp.forEach(iarray => {
      let tmp2 = [];
      if ((i.children[0] as unknown as Text).data == iarray.folder) {
        anchor_tag.get().forEach(i2 => {
          if (i2.parent) {
            if (
              (i.children[0] as unknown as Text).data ==
              (
                i2.parent.parent.parent.children[0]
                  .children[0] as unknown as Text
              ).data
            ) {
              tmp2.push({ href: i2.attribs.href, name: i2.children[0].data });
            } else if (
              i2.parent.parent.parent.children[0].children[0].data ==
              'Bookmarks'
            ) {
              tmp4.push({ href: i2.attribs.href, name: i2.children[0].data });
            }
          }
        });
      }
      tmp3.push({ folder: i.children[0].data, children: [...tmp2] });
    });
  });

  tmp3[0].children = [...tmp4];

  function sortByKey(array, key) {
    return array.sort(function (a, b) {
      var x = a[key];
      var y = b[key];
      return x < y ? -1 : x > y ? 1 : 0;
    });
  }

  arrayjson1 = sortByKey(arrayjson1, 'href');
  arrayjson1 = sortByKey(arrayjson1, 'name');

  console.log('Total Bookmarks:', count);
}
