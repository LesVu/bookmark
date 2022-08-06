const cheerio = require('cheerio');
const fs = require('fs');

fs.readFile('src/bookmarks.html', async (err, data) => {
  if (err) console.error(err);
  const $ = cheerio.load(data);
  let atag = $('DL DT A');
  let h3tag = $('H3');
  // console.log(atag.get(0).attribs.href);
  // console.log(atag.get(0).children[0].data);
  // console.log(atag.get(0).parent.parent.parent.children[0].children[0].data);
  let count = 0;
  let arrayjson1 = [];
  atag.get().forEach(async i => {
    // console.log(
    //   i.attribs.href,
    //   '  ->  ',
    //   i.children[0].data,
    //   '  =>  Folder Name: ',
    //   i.parent.parent.parent.children[0].children[0].data
    // );

    count++;
    // console.log(i.parent.parent.parent.children[0].children[0]);
    arrayjson1.push({ href: i.attribs.href, name: i.children[0].data });
  });

  let tmp3 = [];
  let tmp4 = [];
  h3tag.get().forEach(i => {
    let tmp = [{ folder: i.children[0].data, children: [] }];
    tmp4 = [];
    tmp.forEach(iarray => {
      let tmp2 = [];
      if (i.children[0].data == iarray.folder) {
        atag.get().forEach(i2 => {
          if (
            i.children[0].data ==
            i2.parent.parent.parent.children[0].children[0].data
          ) {
            tmp2.push({ href: i2.attribs.href, name: i2.children[0].data });
          } else if (
            i2.parent.parent.parent.children[0].children[0].data == 'Bookmarks'
          ) {
            tmp4.push({ href: i2.attribs.href, name: i2.children[0].data });
          }
        });
      }
      tmp3.push({ folder: i.children[0].data, children: [...tmp2] });
    });
  });

  tmp3[0].children = [...tmp4];

  console.log('Total Bookmarks:', count);
  let data1 = JSON.stringify(tmp3, null, 2);
  let data2 = JSON.stringify(arrayjson1, null, 2);
  try {
    fs.writeFileSync('./dist/data.json', data1);
    fs.writeFileSync('./dist/data2.json', data2);
    console.log('Successfully write to data.json');
    console.log('Successfully write to data2.json');
  } catch (err) {
    console.error(err);
  }
});
