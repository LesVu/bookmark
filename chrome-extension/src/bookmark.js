const { load } = require('cheerio');
export function extractBookmark(data, use_no_unique = false) {
  const $ = load(data);
  let anchor_tag = $('DL DT A');

  let array_sorted = [];
  anchor_tag.get().forEach(async (i) => {
    if (i.attribs['href'] && i.children[0]) {
      array_sorted.push({
        href: i.attribs['href'],
        name: i.children[0].data,
      });
    }
  });

  array_sorted = sortByKey(array_sorted, 'href');
  array_sorted = sortByKey(array_sorted, 'name');

  if (use_no_unique) {
    console.log('Total Bookmarks:', array_sorted.length);
    return array_sorted;
  } else {
    const uniqueBookmark = [
      ...new Map(array_sorted.map((v) => [v.href, v])).values(),
    ];
    console.log('Total Bookmarks without dupes:', uniqueBookmark.length);
    return uniqueBookmark;
  }
}

export function sortBookmark(data) {
  let website = [];
  // Extract website name
  data.forEach((i) => {
    const web = i.href
      .replace(/^https?:\/\//, '')
      .replace(/^www\d?\./, '')
      .replace(/\..*$/, '');
    if (!web) {
      console.error('Error: Website not found', i.href);
    }
    if (web) {
      if (!website.includes(web)) website.push(web);
    }
  });
  // console.log(website);

  let sorted_result = [];
  let sorted_not_found = [];

  website.forEach((i) => {
    let website_result = [];
    let temp_variable = {
      website: i,
      children: [],
    };

    // Find and list website
    data.forEach((i2) => {
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

    if (website_result.length >= Number(13)) {
      if (false) {
        console.log(i);
        sorted_not_found.push(...website_result);
      } else {
        const chunkSize = Number(50);
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

export function generateBookmark(data) {
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

  function writeBookmarksPayload(datas, level) {
    let indent = '';
    for (let i = 0; i < level; i++) {
      indent = indent.concat('    ');
    }

    strings = strings.concat(indent + '<DL><p>\n');

    datas.forEach((i) => {
      if ('website' in i) {
        strings = strings.concat(indent + '<DT><H3>' + i.website + '</H3>\n');
        writeBookmarksPayload(i.children, level + 1);
      }
      if ('href' in i && 'name' in i) {
        strings = strings.concat(
          indent + '<DT><A HREF="' + i.href + '">' + i.name + '</A>\n'
        );
      }
    });
    strings = strings.concat(indent + '</DL><p>\n');
  }

  writeBookmarksPayload(data, 0);

  payload = payload.concat(strings);

  return payload;
}

export function sortByKey(array, key) {
  return array.sort(function (a, b) {
    var x = a[key];
    var y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}
