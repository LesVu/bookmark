import path from 'path';
import fs from 'fs';
import { readFile, writeFile } from './utils/filesystem';
import { load } from 'cheerio';

// console.log(readFile('./statics/test.json'));
// writeFile('./static/hs.json', 'test');
// console.log(fs.existsSync(path.resolve('./static')));
// console.log(path.resolve('./static'));

const $ = load(readFile('./static/bookmark.html') as string);
let atag = $('DL DT A');
let h3tag = $('H3');
// console.log(atag.get(0).attribs.href);
// console.log(atag.get(0).children[0].data);
// console.log(atag.get(0).parent.parent.parent.children[0].children[0].data);
let count = 0;
let arrayjson1 = [];
