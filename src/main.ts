import path from 'path';
import fs from 'fs';
import { readFile, writeFile } from './utils/filesystem';
import { extractBookmark } from './utils/bookmark';
import { load } from 'cheerio';

// console.log(readFile('./statics/test.json'));
// writeFile('./static/hs.json', 'test');
// console.log(fs.existsSync(path.resolve('./static')));
// console.log(path.resolve('./static'));

// console.log(extractBookmark(readFile('./static/bookmarks.html') as string));
