import fs from 'fs';
import TOML from '@ltd/j-toml';
import { Config, puppeteerOption } from '../types/bookmark_types';
import { Page } from 'puppeteer';
import puppeteer from 'puppeteer';

export function sortByKey<T, K extends keyof T>(array: T[], key: K): T[] {
  return array.sort(function (a, b) {
    var x = a[key];
    var y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

export function readConfig() {
  try {
    let config_buffer = fs.readFileSync('./config.toml', {
      encoding: 'utf8',
    });
    let config: Config = TOML.parse(config_buffer);
    return config;
  } catch (err) {
    console.log('No config available using default config');
    const default_config_buffer = `[exclude]
# Website to not sort
website = []

[website]
# How many in a folder before increment
folder_size = 50

# Minimum number to not sort
folder_exclude_size = 10

# Tags for NHSorter
# Default noTags
# Tags: 'lolicon', 'shotacon', 'big breasts', 'yaoi', 'yuri'
nh_tags = []`;
    fs.writeFileSync('./config.toml', default_config_buffer);
    let default_config: Config = TOML.parse(default_config_buffer);
    return default_config;
  }
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function puppeteerBrowser(option: puppeteerOption, callback: (page: Page) => Promise<void>) {
  if (option.user_agent === undefined)
    option.user_agent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';

  // const browser = await puppeteer.launch({
  //   headless: false,
  //   args: ['--no-sandbox'],
  //   executablePath: '/usr/bin/chromium',
  // });
  const browser = await puppeteer.connect({
    // browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser/601763bc-1ae7-40f8-8d7a-e4dcec814ca6',
    // chromium --no-sandbox --remote-debugging-port=9222
    browserURL: 'http://127.0.0.1:9222',
  });

  const page = (await browser.pages())[0];
  // const page = await browser.newPage();
  await page?.setUserAgent(option.user_agent);

  if (!page) throw new Error('browser problem');

  await page.goto(option.url);
  if (option.waiting_time) await sleep(option.waiting_time);

  await callback(page);

  await browser.close();
  return;
}
