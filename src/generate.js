const fs = require('fs');

let tempdata1 = fs.readFileSync('./dist/datasorted.json', { encoding: 'utf8' });
let tempdata = JSON.parse(tempdata1.toString());

let payload = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
`;
let tmp1 = '';
tempdata.forEach(i => {
  let tmp = '';
  tmp = tmp.concat(`<DL><p>\n<DT><H3>${i.website}</H3>\n<DL><p>\n`);
  i.children.forEach(i2 => {
    tmp = tmp.concat(`<DT><A HREF="${i2.href}">${i2.name}</A>\n`);
  });
  tmp1 = tmp1.concat(tmp, '</DL><p>\n');
});
payload = payload.concat(tmp1, '</DL><p>\n');
// console.log(tmp1);

try {
  fs.writeFileSync('./dist/bookmark.html', payload);
  console.log('Successfully write bookmark');
} catch (err) {
  console.error(err);
}

// console.log(payload);
