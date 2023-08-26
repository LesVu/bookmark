import { load } from 'cheerio';
import fs from 'fs';
import { Bookmark_Item, Bookmark, APIBook, Tags } from '../types/bookmark_types';
import { sortByKey, readConfig, puppeteerBrowser, sleep } from './misc';

export function extractBookmark(data: string, use_no_unique: boolean = false): Bookmark_Item[] {
  const $ = load(data);
  let anchor_tag = $('DL DT A');

  let array_sorted: Bookmark_Item[] = [];
  anchor_tag.get().forEach(async i => {
    if (i.attribs['href'] && i.children[0]) {
      array_sorted.push({
        href: i.attribs['href'],
        name: (i.children[0] as unknown as Text).data,
      });
    }
  });

  array_sorted = sortByKey(array_sorted, 'href');
  array_sorted = sortByKey(array_sorted, 'name');

  if (use_no_unique) {
    console.log('Total Bookmarks:', array_sorted.length);
    return array_sorted;
  } else {
    const uniqueBookmark = [...new Map(array_sorted.map(v => [v.href, v])).values()];
    console.log('Total Bookmarks without dupes:', uniqueBookmark.length);
    return uniqueBookmark;
  }
}

export function sortBookmark(data: Bookmark_Item[]): Bookmark[] {
  let config = readConfig();

  let website: string[] = [];
  // Extract website name
  data.forEach(i => {
    const web = i.href
      .replace(/^https?:\/\//, '')
      .replace(/^www\d?\./, '')
      .replace(/\..*$/, '');
    if (!web) {
      console.error('Error: Website not found', i.href);
    }
    // let web: string;
    // let found = i.href.match(/^(?:https?:\/\/)?(?:[^.\n]+\.)?([^.\n]+\.[a-z]{2,})(?:$|\/)/);
    // if (found) {
    //   web = String(found![1]);
    // } else {
    //   web = String(i.href.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)\//)![1]);
    // }
    if (web) {
      if (!website.includes(web)) website.push(web);
    }
  });
  // console.log(website);

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

export function generateBookmark(data: Bookmark[]): string {
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
export async function NHSorter(data: Bookmark[]): Promise<Bookmark[]> {
  const config = readConfig();
  const pageMin = 13;
  let codes: string[] = [];
  data.forEach(i => {
    if (i.website == 'nhentai') {
      i.children.forEach(j => {
        (
          j as {
            website: string;
            children: Bookmark_Item[];
          }
        ).children.forEach(k => {
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
  let json_data: APIBook[] = [];

  const filter_data = data.filter(e => {
    return e.website !== 'nhentai';
  });

  await puppeteerBrowser({ url: 'https://nhentai.net' }, async page => {
    await sleep(30000);

    // const tagList = ['lolicon', 'anal', 'shotacon', 'big breasts', 'yaoi', 'yuri', 'noTags'];
    const tagList: string[] = [...(config.website?.nh_tags as string[]), `pagelessthan${pageMin}`, 'noTags'];
    let placeholder: {
      website: string;
      children: Bookmark_Item[];
    }[] = [];
    for (let i = 0; i < tagList.length; i++) {
      placeholder.push({ website: tagList[i]!, children: [] });
    }

    if (fs.existsSync('data_NH.json')) {
      json_data = JSON.parse(fs.readFileSync('data_NH.json', 'utf8'));
    } else {
      json_data = [];
    }
    let count = 0;
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      try {
        // Might error but i done with this shit
        let json: APIBook;
        if (json_data.length == 0 || !json_data.find(e => e.id == code)) {
          const url = `https://nhentai.net/api/gallery/${code}`;
          await page.goto(url);
          json = await page.evaluate(() => {
            return JSON.parse(document!.querySelector('body')!.innerText);
          });
          // if (json.error) {
          //   throw `${code}: ${json.error}`;
          // }
          json_data.push(json);
        } else {
          json = json_data.find(e => e.id == code)!;
        }
        // let // extension,
        //   tag: string[] = [];

        // for (let q = 0; q < json.tags.length; q++) {
        //   const element = json.tags[q]!;
        //   // switch (element.name) {
        //   //   case 'lolicon':
        //   //     tag.push('lolicon');
        //   //     break;
        //   //   // case 'anal':
        //   //   //   tag.push('anal');
        //   //   //   break;
        //   //   case 'shotacon':
        //   //     tag.push('shotacon');
        //   //     break;
        //   //   case 'big breasts':
        //   //     tag.push('big breasts');
        //   //     break;
        //   //   case 'yaoi':
        //   //     tag.push('yaoi');
        //   //     break;
        //   //   case 'yuri':
        //   //     tag.push('yuri');
        //   //     break;
        //   //   case 'crossdressing':
        //   //     tag.push('crossdressing');
        //   //     break;
        //   //   case 'pregnant':
        //   //     tag.push('pregnant');
        //   //     break;
        //   //   default:
        //   //     break;
        //   // }
        // }

        if (json.tags) {
          const matchedTags: Tags[] = json.tags.filter(tag => tagList.includes(tag.name));

          let firstMatchedTag: Tags | undefined;
          for (let i = 0; i < tagList.length; i++) {
            firstMatchedTag = matchedTags.find(tag => tag.name === tagList[i]);
            if (firstMatchedTag) {
              break;
            }
          }
          for (let e of data) {
            if (e.website == 'nhentai') {
              for (let g of e.children) {
                for (const h of (
                  g as {
                    website: string;
                    children: Bookmark_Item[];
                  }
                ).children) {
                  if (h.href == `https://nhentai.net/g/${code}/`) {
                    if ((json.num_pages as number) <= pageMin) {
                      placeholder[tagList.length - 2]?.children.push(h);
                    } else if (firstMatchedTag) {
                      // console.log('reachehhh');
                      let objIndex = tagList.findIndex(obj => obj == firstMatchedTag?.name);
                      placeholder[objIndex]?.children.push(h);
                    } else {
                      // console.log('reach');
                      placeholder[tagList.length - 1]?.children.push(h);
                    }
                  }
                }
              }
            }
          }
        }

        // if (json.num_pages >= 100) {
        //   pathToWrite = `./static/pagemorethan100/${code}-(${
        //     tag ? tag.join(', ') : 'empty'
        //   }).${extension}`;
        // }
      } catch (err) {
        console.log(err);
        count++;
      }
    }
    console.log('Broken Count:', count);
    filter_data.unshift({ website: 'nhentai', children: placeholder });
    return Promise.resolve();
  });

  fs.writeFileSync('./data_NH.json', JSON.stringify(json_data));
  return filter_data;
}

// Website specific sorter
export async function JVGRSorter(data: Bookmark[]) {
  const config = readConfig();
  let urls: string[] = [];
  data.forEach(i => {
    if (i.website == 'jav') {
      i.children.forEach(j => {
        (j as { website: string; children: Bookmark_Item[] }).children.forEach(k => {
          urls.push(k.href);
        });
      });
    }
  });
  // console.log(urls);
  // await puppeteerBrowser({ url: '' }, async page => {});
}
