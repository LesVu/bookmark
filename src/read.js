const fs = require('fs');

let tempdata1 = fs.readFileSync('./dist/data2.json', { encoding: 'utf8' });
let tempdata = JSON.parse(tempdata1.toString());
// console.log(tempdata);

let website = [];
tempdata.forEach(i => {
  const web = i.href.substring(8, i.href.indexOf('.'));
  if (!website.includes(web)) website.push(web);
});

let sorted = [];
let sorted1 = [];

website.forEach(i => {
  let result = [];
  tempdata.forEach(i2 => {
    if (i == i2.href.substring(8, i2.href.indexOf('.'))) {
      result.push(i2);
    }
  });
  if (result.length >= 5) {
    sorted.push({ website: i, children: [...result] });
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
