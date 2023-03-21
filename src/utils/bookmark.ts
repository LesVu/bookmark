// @ts-nocheck
import { load } from 'cheerio';
import { writeFileSync } from 'fs';
import { Bookmark_Item, Bookmark } from '../types/bookmark_types';
import { sortByKey, readConfig, puppeteerBrowser, sleep } from './misc';

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

  let sorted_result: Bookmark[] = [];
  let sorted_not_found: Bookmark_Item[] = [];

  website.forEach(i => {
    let website_result: Bookmark_Item[] = [];
    let temp_variable: Bookmark = {
      website: i,
      children: [],
    };

    // Find and list website
    data.forEach(i2 => {
      if (
        i ==
        i2.href
          .replace(/^https?:\/\//, '')
          .replace(/^www\d?\./, '')
          .replace(/\..*$/, '')
      ) {
        website_result.push(i2);
      }
    });

    if (website_result.length >= Number(config.website!.folder_exclude_size)) {
      if (config.exclude!.website.find(elmt => elmt == i)) {
        console.log(i);
        sorted_not_found.push(...website_result);
      } else {
        const chunkSize = Number(config.website!.folder_size);
        if (website_result.length >= chunkSize && chunkSize > 0) {
          for (let i2 = 0; i2 < website_result.length; i2 += chunkSize) {
            const chunk = website_result.slice(i2, i2 + chunkSize);
            // let result2 = [];
            // result2.push({ website: i + i2 / 10, children: [...chunk] });
            // sorted.push({ website: i, children: [...result2] });
            temp_variable.children.push({
              website: i + i2 / chunkSize,
              children: chunk,
            });
          }
          sorted_result.push(temp_variable);
        } else {
          sorted_result.push({ website: i, children: [...website_result] });
        }
      }
    } else {
      sorted_not_found.push(...website_result);
    }
  });

  sorted_result.push({ website: 'none', children: sorted_not_found });
  return sorted_result;
}

export function generateBookmark(data: Bookmark[]) {
  let payload = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DT><H3>Collection</H3>
`;

  let strings = '';

  function writeBookmarksPayload(datas: Bookmark[] | Bookmark_Item[], level: number) {
    let indent = '';
    for (let i = 0; i < level; i++) {
      indent = indent.concat('    ');
    }

    strings = strings.concat(indent + '<DL><p>\n');

    datas.forEach(i => {
      if ('website' in i) {
        strings = strings.concat(indent + '<DT><H3>' + i.website + '</H3>\n');
        writeBookmarksPayload(i.children as Bookmark_Item[], level + 1);
      }
      if ('href' in i && 'name' in i) {
        strings = strings.concat(indent + '<DT><A HREF="' + i.href + '">' + i.name + '</A>\n');
      }
    });
    strings = strings.concat(indent + '</DL><p>\n');
  }

  writeBookmarksPayload(data, 0);

  payload = payload.concat(strings);

  return payload;
}

// Website specific sorter
export async function NHSorter(data: Bookmark[]) {
  let codes: string[] = [];
  data.forEach(i => {
    if (i.website == 'nhentai') {
      i.children.forEach(j => {
        j.children.forEach(k => {
          if (k.href) {
            let match = k.href.match(/\/(\d{4,})(?=\/|$)/);
            if (match) {
              codes.push(match[1] as string);
            }
          }
        });
      });
    }
  });
  console.log(codes);
  let value: Bookmark[];
  let json_data = [];

  await puppeteerBrowser({ url: 'https://nhentai.net' }, async page => {
    await sleep(30000);
    interface Tags {
      id: number;
      type: string;
      name: string;
      url: string;
      count: number;
    }

    interface Images {
      pages: Array<{ t: string; w: number; h: number }>;
      cover: { t: string; w: number; h: number };
      thumbnail: { t: string; w: number; h: number };
    }

    type APIBook = {
      title: {
        english: string;
        japanese: string;
        pretty: string;
      };
      id: number | string;

      media_id: number | string;

      num_favorites: number | string;

      num_pages: number | string;

      scanlator: string;

      upload_date: number | string;

      images: Images;

      tags: Array<Tags>;
    };

    const filter_data = data.filter(e => {
      return e.website !== 'nhentai';
    });

    let placeholder: Bookmark[] = [
      { website: 'lolicon', children: [] },
      { website: 'shotacon', children: [] },
      { website: 'big breasts', children: [] },
      { website: 'yaoi', children: [] },
      { website: 'yuri', children: [] },
      { website: 'crossdressing', children: [] },
      { website: 'pregnant', children: [] },
      { website: 'noTag', children: [] },
    ];

    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      try {
        const url = `https://nhentai.net/api/gallery/${code}`;
        await page.goto(url);

        const json: APIBook | { error: string } = await page.evaluate(() => {
          return JSON.parse(document!.querySelector('body')!.innerText);
        });
        json_data.push(json);
        let // extension,
          tag: string[] = [];

        if ('error' in json) {
          throw `${code}: ${json.error}`;
        }

        json.tags.forEach(item => {
          switch (item.name) {
            case 'lolicon':
              tag.push('lolicon');
              break;
            // case 'anal':
            //   tag.push('anal');
            //   break;
            case 'shotacon':
              tag.push('shotacon');
              break;
            case 'big breasts':
              tag.push('big breasts');
              break;
            case 'yaoi':
              tag.push('yaoi');
              break;
            case 'yuri':
              tag.push('yuri');
              break;
            case 'crossdressing':
              tag.push('crossdressing');
              break;
            case 'pregnant':
              tag.push('pregnant');
              break;
            default:
              break;
          }
        });

        // switch (json.images.cover.t) {
        //   case 'j':
        //   case 'jpg':
        //   case 'jpeg':
        //     extension = 'jpg';
        //     break;
        //   case 'p':
        //   case 'png':
        //     extension = 'png';
        //     break;
        //   case 'g':
        //   case 'gif':
        //     extension = 'gif';
        //     break;
        // }

        // switch (tag.length) {
        //   case 0:
        //     pathToWrite = `./static/noTags/${code}.${extension}`;
        //     break;
        //   case 1:
        //     pathToWrite = `./static/${tag[0]}/${code}.${extension}`;
        //     break;
        //   case 2:
        //     pathToWrite = `./static/twoTags/${code}-(${tag.join(', ')}).${extension}`;
        //     break;
        //   case 3:
        //     pathToWrite = `./static/threeTags/${code}-(${tag.join(', ')}).${extension}`;
        //     break;
        //   default:
        //     pathToWrite = `./static/multiTags/${code}-(${tag.join(', ')}).${extension}`;
        //     break;
        // }

        // if (json.num_pages >= 100) {
        //   pathToWrite = `./static/pagemorethan100/${code}-(${
        //     tag ? tag.join(', ') : 'empty'
        //   }).${extension}`;
        // }

        data.forEach(e => {
          if (e.website == 'nhentai') {
            e.children.forEach(j => {
              if (!('href' in j)) {
                j.children.forEach(m => {
                  if (m.href == `https://nhentai.net/g/${code}`) {
                    placeholder.forEach(h => {
                      if (tag) {
                        if (h.website == tag[0]) {
                          h.children.push(m);
                        }
                      } else {
                        if (h.website == 'noTag') {
                          h.children.push(m);
                        }
                      }
                    });
                  }
                });
              }
            });
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
    value = placeholder;
    return Promise.resolve();
  });
  let json_data1 = JSON.stringify(json_data, null, 2);
  writeFileSync('./data.json', json_data1);
  return value;
}
