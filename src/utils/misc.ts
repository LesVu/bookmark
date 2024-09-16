import fs from 'fs';
import TOML from '@ltd/j-toml';
import { Config, puppeteerOption } from '../types/bookmark_types.ts';
import { Page, Browser } from 'puppeteer';
import puppeteer from 'puppeteer';

export function sortByKey<T, K extends keyof T>(array: T[], key: K): T[] {
  return array.sort(function (a, b) {
    const x = a[key];
    const y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

export function readConfig() {
  try {
    const config_buffer = fs.readFileSync('./config.toml', {
      encoding: 'utf8',
    });
    const config = TOML.parse(config_buffer) as Config;
    return config;
  } catch (_) {
    console.log('No config available using default config');
    const default_config_buffer = `[exclude]
# Website to not sort
website = []

[website]
# How many in a folder before increment
folderSize = 50

# Minimum number to not sort
folderExcludeSize = 10

# Tags for NHSorter
# Default noTags
# Tags: 'lolicon', 'shotacon', 'big breasts', 'yaoi', 'yuri'
nh_tags = []`;
    fs.writeFileSync('./config.toml', default_config_buffer);
    const default_config = TOML.parse(default_config_buffer) as Config;
    return default_config;
  }
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function puppeteerBrowser(
  option: puppeteerOption,
  callback: (page: Page, browser?: Browser) => Promise<void>
) {
  if (option.user_agent === undefined)
    option.user_agent =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

  const browser = await puppeteer.launch({
    headless: true,
    // args: ['--no-sandbox'],
    executablePath: '/nix/store/7i6rgqxry3dvvsvs7xazlwd843bfpgbb-chromium-128.0.6613.119/bin/chromium',
  });
  // const browser = await puppeteer.connect({
  //   // browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser/601763bc-1ae7-40f8-8d7a-e4dcec814ca6',
  //   // chromium --no-sandbox --remote-debugging-port=9222
  //   browserURL: 'http://127.0.0.1:9222',
  // });

  const page = (await browser.pages())[0];
  // const page = await browser.newPage();
  await page?.setUserAgent(option.user_agent);

  if (!page) throw new Error('browser problem');

  await page.goto(option.url);
  if (option.waiting_time) await sleep(option.waiting_time);

  await callback(page, browser);

  // if (browser.connected) browser.disconnect();
  browser.close();

  return Promise.resolve();
}
