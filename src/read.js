const fs = require('fs');
const TOML = require('@ltd/j-toml');

let tempdata1 = fs.readFileSync('./dist/data2.json', { encoding: 'utf8' });
let tempdata = JSON.parse(tempdata1.toString());
// console.log(tempdata);
let tempconfig = fs.readFileSync('config.toml', { encoding: 'utf8' });
let config = TOML.parse(tempconfig);

let website = [];
tempdata.forEach(i => {
  const web = i.href
    .replace(/^https?:\/\//, '')
    .replace(/^www\d?\./, '')
    .replace(/\..*$/, '');
  if (!website.includes(web)) website.push(web);
});

let sorted = [];
let sorted1 = [];

website.forEach(i => {
  let result = [];
  let websort = { website: i, children: [] };

  tempdata.forEach(i2 => {
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

  if (result.length >= Number(config.website.folder_exclude_size)) {
    if (config.exclude.website.find(elmt => elmt == i)) {
      sorted1.push(...result);
    } else {
      const chunkSize = Number(config.website.folder_size);
      if (result.length >= chunkSize) {
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

let data = JSON.stringify(sorted, null, 2);
try {
  fs.writeFileSync('./dist/datasorted.json', data);
  console.log('Successfully write to datasorted.json');
} catch (err) {
  console.error(err);
}
