import { puppeteerBrowser, sleep } from './utils/misc';

puppeteerBrowser({ url: 'https://nowsecure.nl/' }, async _ => {
  await sleep(60000);
});
