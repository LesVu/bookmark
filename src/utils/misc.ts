import fs from 'fs';
import TOML from '@ltd/j-toml';
import { Config, puppeteerOption } from '../types/bookmark_types';
import { Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';

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

  // const stealthPlugin = StealthPlugin();
  // stealthPlugin.enabledEvasions.delete('iframe.contentWindow');
  // stealthPlugin.enabledEvasions.delete('media.codecs');
  // puppeteer.use(stealthPlugin);
  puppeteer.use(require('puppeteer-extra-plugin-stealth/evasions/navigator.webdriver')());
  puppeteer.use(require('puppeteer-extra-plugin-stealth/evasions/sourceurl')());
  const UserAgentOverride = require('puppeteer-extra-plugin-stealth/evasions/user-agent-override');
  // Define custom UA and locale
  const ua = UserAgentOverride({
    userAgent: option.user_agent,
  });
  puppeteer.use(ua);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
  });
  const page = (await browser.pages())[0];
  // const page = await browser.newPage();

  if (!page) throw new Error('browser problem');

  await page.setUserAgent(option.user_agent, {
    platform: 'Windows',
    platformVersion: '10',
    architecture: 'x64',
    model: 'x64',
    mobile: false,
  });

  await page.setViewport({ width: 800, height: 600 });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'platform', { value: 'Win32' });
  });

  await page.goto(option.url);
  if (option.waiting_time) await sleep(option.waiting_time);

  await callback(page);

  // await browser.close();
  return;
}
