import { load } from 'cheerio';
import fs from 'fs';
import { Bookmark, Bookmarks, APIBook, Config, Bookmarks_Parts } from '../types/bookmark_types.ts';
import { sortByKey, readConfig, puppeteerBrowser, sleep } from './misc.ts';
// import { spawn } from 'npm:child_process';

/**
 * Extract a list of bookmarks from an HTML string.
 *
 * This function is used to extract bookmarks from a bookmarks.html file
 * generated by Firefox.
 *
 * If the `duplicate` parameter is set to `true`, then the function will
 * return the list of bookmarks without removing duplicates.
 * @param {string} html The HTML string to extract the bookmarks from.
 * @param {boolean} [removeDuplicates] Whether or not to remove duplicate bookmarks. Defaults to `false`.
 * @return {Bookmark[]} The list of extracted bookmarks.
 */
export function extractBookmarks(html: string, removeDuplicates: boolean = false): Bookmark[] {
  const $ = load(html);
  const anchorTags = $('DL DT A');

  const bookmarks: Bookmark[] = [];
  anchorTags.get().forEach(anchorTag => {
    const href = anchorTag.attribs['href'];
    const name = (anchorTag.children[0] as unknown as Text).data;
    if (href && name) {
      bookmarks.push({ href, name });
    }
  });

  const sortedBookmarks = sortByKey(bookmarks, 'href').sort((a, b) => a.name.localeCompare(b.name));

  return removeDuplicates ? sortedBookmarks : [...new Map(sortedBookmarks.map(v => [v.href, v])).values()];
}

/**
 * Sort bookmarks by website.
 *
 * This function takes a list of bookmarks and groups them by website.
 * The function also chunks the bookmarks by folder size and excludes websites
 * specified in the config file.
 *
 * @param {Bookmark[]} bookmarks The list of bookmarks to sort.
 * @return {Bookmarks[]} The sorted list of bookmarks.
 */
export function sortBookmarks(bookmarks: Bookmark[], testConfig?: Config): Bookmarks[] {
  const config = testConfig ? testConfig : readConfig();

  const websites: string[] = [];
  // Extract website name
  bookmarks.forEach(bookmark => {
    const website = getWebsite(bookmark.href);
    if (website && !websites.includes(website)) {
      websites.push(website);
    }
  });

  const sortedResult: Bookmarks[] = [];
  const sortedNotFound: Bookmark[] = [];

  websites.forEach(website => {
    const websiteBookmarks: Bookmark[] = [];
    const websiteFolder: Bookmarks = {
      website,
      children: [],
    };

    // Find and list website
    bookmarks.forEach(bookmark => {
      if (getWebsite(bookmark.href) === website) {
        websiteBookmarks.push(bookmark);
      }
    });

    if (websiteBookmarks.length >= Number(config.website!.folderExcludeSize)) {
      if (config.exclude!.website.includes(website)) {
        sortedNotFound.push(...websiteBookmarks);
      } else {
        const chunkSize = Number(config.website!.folderSize);
        if (chunkSize > 0) {
          for (let i = 0; i < websiteBookmarks.length; i += chunkSize) {
            const chunk = websiteBookmarks.slice(i, i + chunkSize);
            websiteFolder.children.push({
              website: `${website} ${i / chunkSize}`,
              children: chunk,
            });
          }
          sortedResult.push(websiteFolder);
        } else {
          sortedResult.push({ website, children: websiteBookmarks });
        }
      }
    } else {
      sortedNotFound.push(...websiteBookmarks);
    }
  });

  sortedResult.push({ website: 'none', children: sortedNotFound });
  return sortedResult;
}

/**
 * Extract the website name from a URL.
 *
 * @param {string} url - The URL to extract the website name from.
 * @returns {string | undefined} The website name, or undefined if the URL does not end with a top-level domain.
 */
export function getWebsite(url: string): string | undefined {
  try {
    const parsedUrl = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `http://${url}`);
    const domainParts = parsedUrl.hostname.split('.');

    // If the hostname has more than 2 parts, remove the subdomain
    return domainParts.length > 1 ? domainParts.slice(-2, -1)[0] : parsedUrl.hostname;
  } catch {
    return undefined;
  }
}

/**
 * Generate a Netscape Bookmark file from a nested list of bookmarks.
 *
 * This function takes a nested list of bookmarks and generates a Netscape Bookmark file from it.
 * The function will recursively traverse the nested list and generate the bookmark file.
 *
 * @param {Bookmarks[]} bookmarks The nested list of bookmarks.
 * @return {string} The generated Netscape Bookmark file as a string.
 */
export function generateBookmark(bookmarks: Bookmarks[]): string {
  const payload = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DT><H3>Collection</H3>
`;

  let result = '';

  function writeBookmarks(bookmarks: Bookmarks[] | Bookmark[], level: number) {
    const indent = '    '.repeat(level);

    result += `${indent}<DL><p>\n`;

    for (const bookmark of bookmarks) {
      if ('website' in bookmark) {
        result += `${indent}<DT><H3>${bookmark.website}</H3>\n`;
        writeBookmarks(bookmark.children as Bookmark[], level + 1);
      } else {
        result += `${indent}<DT><A HREF="${bookmark.href}">${bookmark.name}</A>\n`;
      }
    }

    result += `${indent}</DL><p>\n`;
  }

  writeBookmarks(bookmarks, 0);

  return payload + result;
}

export async function NHSorter(data: Bookmarks[]): Promise<Bookmarks[]> {
  const config = readConfig();
  const minPages = 16;
  const maxPages = 100;
  const filteredData = data.filter(bookmark => bookmark.website !== 'nhentai');
  const bookmarks = data
    .filter(bookmark => bookmark.website == 'nhentai')
    .flatMap(child => (child as Bookmarks).children)
    .flatMap(child => (child as Bookmarks_Parts).children);
  const codes = bookmarks.map(child => child.href.match(/\/(\d{4,})(?=\/|$)/)?.[1]).filter(code => code != undefined);
  const tagList = [
    ...(config.website?.nh_tags as string[]),
    'artist',
    `pagemorethan${maxPages}`,
    `pagelessthan${minPages}`,
    'notags',
  ];
  const placeholders: Bookmarks[] = tagList.map(tag => ({ website: tag, children: [] }));
  const codeBroken: string[] = [];

  let jsonData: APIBook[] = [];

  if (fs.existsSync('data_NH.json')) {
    jsonData = JSON.parse(fs.readFileSync('data_NH.json', 'utf8'));
  }

  await puppeteerBrowser({ url: 'https://nhentai.net' }, async page => {
    for (const code of codes) {
      if (!jsonData.find(book => book.id == code)) {
        const url = `https://nhentai.net/api/gallery/${code}`;
        await page.goto(url);
        const json = await page.evaluate(() => JSON.parse(document.querySelector('body')!.innerText));
        if (json.error) {
          codeBroken.push(code);
          continue;
        }
        jsonData.push(json);
      }

      const book = jsonData.find(book => book.id == code)!;
      const firstMatchedTag = book.tags
        .filter(tag => tagList.includes(tag.name))
        .find(tag => tagList.includes(tag.name));

      const bookmarkMatch = bookmarks.filter(bookmark => bookmark.href.includes(code))!;
      if (bookmarkMatch.length > 1) {
        codeBroken.push(code);
        continue;
      }
      const bookmark = bookmarkMatch[0];

      switch (true) {
        // If the number of pages is less than minimun pages
        case (book.num_pages as number) <= minPages:
          placeholders[placeholders.length - 2].children.push(bookmark);
          break;
        // If the number of pages is greater than maximun pages
        case (book.num_pages as number) >= maxPages:
          placeholders[placeholders.length - 3].children.push(bookmark);
          break;
        // Checks if firstMatchedTag is matched
        case !!firstMatchedTag: {
          const objIndex = tagList.findIndex(obj => obj === firstMatchedTag.name);
          placeholders[objIndex].children.push(bookmark);
          break;
        }
        // If nothing is matched
        default:
          placeholders[placeholders.length - 1].children.push(bookmark);
          break;
      }
    }
  });

  const bookmarkElm = bookmarks.filter(bookmark => {
    // Default to include the element unless a condition excludes it
    let include = true;
    for (const code of codes) {
      if (bookmark.href.includes(code)) {
        // Exclude if the code is not in codeBroken, else include it
        if (!codeBroken.includes(code)) {
          include = false;
          break; // If it's not broken, stop further checks for this bookmark
        }
      }
    }
    return include; // Return true if the bookmark should be included
  });

  bookmarkElm.forEach(bookmark => {
    if (bookmark.href.includes('artist')) {
      placeholders[placeholders.length - 4].children.push(bookmark);
    } else placeholders[placeholders.length - 1].children.push(bookmark);
  });

  const sortedResult: Bookmarks[] = [];

  placeholders.forEach(placeholder => {
    if (placeholder.children.length >= Number(config.website!.folderExcludeSize)) {
      const chunkSize = Number(config.website.folderSize);
      if (chunkSize > 0) {
        const websiteFolder: Bookmarks[] = [];
        for (let i = 0; i < placeholder.children.length; i += chunkSize) {
          const chunk = placeholder.children.slice(i, i + chunkSize);
          websiteFolder.push({
            website: `${placeholder.website} ${i / chunkSize}`,
            children: chunk,
          });
        }
        sortedResult.push({ website: placeholder.website, children: websiteFolder });
      } else {
        sortedResult.push(placeholder);
      }
    } else {
      sortedResult.push(placeholder);
    }
  });

  filteredData.unshift({ website: 'nhentai', children: sortedResult });
  fs.writeFileSync('./data_NH.json', JSON.stringify(jsonData));
  return filteredData;
}

// Todo
export async function JVGRSorter(data: Bookmarks[]) {
  const config = readConfig();
  const urls: string[] = [];
  data.forEach(i => {
    if (i.website == 'jav') {
      i.children.forEach(j => {
        (j as Bookmarks_Parts).children.forEach(k => {
          urls.push(k.href);
        });
      });
    }
  });
  // console.log(urls);
  await puppeteerBrowser({ url: '' }, async page => {});
}
