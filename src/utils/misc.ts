import fs from 'fs';
import TOML from '@ltd/j-toml';
import { Config, puppeteerOption } from '../types/bookmark_types';
import { Page, executablePath } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdBlocker from 'puppeteer-extra-plugin-adblocker';
import Aua from 'puppeteer-extra-plugin-anonymize-ua';
import Recaptcha from 'puppeteer-extra-plugin-recaptcha';

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
folder_exclude_size = 10`;
    fs.writeFileSync('./config.toml', default_config_buffer);
    let default_config: Config = TOML.parse(default_config_buffer);
    return default_config;
  }
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function puppeteerBrowser(
  option: puppeteerOption,
  callback: (page: Page) => Promise<void>
) {
  if (option.user_agent === undefined)
    option.user_agent =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';

  puppeteer.use(StealthPlugin());
  puppeteer.use(AdBlocker());
  puppeteer.use(Recaptcha());
  puppeteer.use(Aua());

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
    executablePath: executablePath(),
  });
  const page = (await browser.pages())[0];

  if (!page) throw new Error('browser problem');

  await page.setViewport({ width: 800, height: 600 });

  await page.setUserAgent(option.user_agent);

  await page.goto(option.url);
  if (option.waiting_time) await sleep(option.waiting_time);

  await callback(page);

  await browser.close();
  return;
}
